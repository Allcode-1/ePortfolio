package com.example.demo.services;

import com.example.demo.dto.analytics.AnalyticsResponse;
import com.example.demo.models.PortfolioAnalytics;
import com.example.demo.models.User;
import com.example.demo.repositories.PortfolioAnalyticsRepository;
import com.example.demo.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AnalyticsService {
    private static final long PUBLIC_VIEW_DEDUP_TTL_MS = 6L * 60L * 60L * 1000L;
    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final PortfolioAnalyticsRepository analyticsRepository;
    private final UserRepository userRepository;
    private final Map<String, Long> publicViewDedup = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Value("${app.analytics.dedupe.redis.enabled:false}")
    private boolean redisDedupeEnabled;

    public AnalyticsService(PortfolioAnalyticsRepository analyticsRepository, UserRepository userRepository) {
        this.analyticsRepository = analyticsRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AnalyticsResponse getMyAnalytics(User user) {
        PortfolioAnalytics analytics = getOrCreate(user.getId());
        return toResponse(analytics);
    }

    @Transactional
    public AnalyticsResponse incrementMyEvent(User user, String eventKey) {
        PortfolioAnalytics analytics = getOrCreate(user.getId());
        incrementByKey(analytics, eventKey);
        return toResponse(analyticsRepository.save(analytics));
    }

    @Transactional
    public void incrementPublicView(String userId, String viewerFingerprint) {
        User owner = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Public profile not found"));

        if (!owner.isPublic()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Public profile not found");
        }

        if (isDuplicatePublicView(owner.getId(), viewerFingerprint)) {
            log.debug("Skipped duplicate public view for userId={}", owner.getId());
            return;
        }

        PortfolioAnalytics analytics = getOrCreate(owner.getId());
        analytics.setPublicViews(analytics.getPublicViews() + 1);
        incrementMonthly(analytics);
        analyticsRepository.save(analytics);
        log.info("Tracked public portfolio view for userId={}", owner.getId());
    }

    private PortfolioAnalytics getOrCreate(String userId) {
        return analyticsRepository.findById(userId).orElseGet(() -> {
            PortfolioAnalytics analytics = new PortfolioAnalytics();
            analytics.setUserId(userId);
            return analyticsRepository.save(analytics);
        });
    }

    private void incrementByKey(PortfolioAnalytics analytics, String eventKey) {
        switch (eventKey) {
            case "shareClicks" -> analytics.setShareClicks(analytics.getShareClicks() + 1);
            case "projectDetailViews" -> analytics.setProjectDetailViews(analytics.getProjectDetailViews() + 1);
            case "certificateFileOpens" -> analytics.setCertificateFileOpens(analytics.getCertificateFileOpens() + 1);
            case "cvDownloads" -> analytics.setCvDownloads(analytics.getCvDownloads() + 1);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported analytics event key");
        }

        incrementMonthly(analytics);
    }

    private void incrementMonthly(PortfolioAnalytics analytics) {
        String monthKey = YearMonth.now(ZoneOffset.UTC).toString();
        long next = analytics.getMonthlyActivity().getOrDefault(monthKey, 0L) + 1L;
        analytics.getMonthlyActivity().put(monthKey, next);
    }

    private AnalyticsResponse toResponse(PortfolioAnalytics analytics) {
        return new AnalyticsResponse(
            analytics.getPublicViews(),
            analytics.getShareClicks(),
            analytics.getProjectDetailViews(),
            analytics.getCertificateFileOpens(),
            analytics.getCvDownloads(),
            analytics.getLastUpdated(),
            new HashMap<>(analytics.getMonthlyActivity())
        );
    }

    private boolean isDuplicatePublicView(String userId, String viewerFingerprint) {
        if (viewerFingerprint == null || viewerFingerprint.isBlank()) {
            return false;
        }

        if (isRedisDedupeEnabled()) {
            return isDuplicateUsingRedis(userId, viewerFingerprint);
        }

        return isDuplicateUsingInMemory(userId, viewerFingerprint);
    }

    private boolean isDuplicateUsingRedis(String userId, String viewerFingerprint) {
        String dedupeKey = "analytics:public-view:" + userId + ":" + hashFingerprint(viewerFingerprint);

        try {
            Boolean firstSeen = redisTemplate.opsForValue()
                .setIfAbsent(dedupeKey, "1", Duration.ofMillis(PUBLIC_VIEW_DEDUP_TTL_MS));

            return firstSeen == null || !firstSeen;
        } catch (RuntimeException ex) {
            log.warn("Redis analytics dedupe fallback to in-memory due to error: {}", ex.getMessage());
            return isDuplicateUsingInMemory(userId, viewerFingerprint);
        }
    }

    private boolean isDuplicateUsingInMemory(String userId, String viewerFingerprint) {
        long now = System.currentTimeMillis();
        String key = userId + "|" + viewerFingerprint;
        Long previous = publicViewDedup.put(key, now);
        cleanupDedup(now);
        return previous != null && now - previous < PUBLIC_VIEW_DEDUP_TTL_MS;
    }

    private void cleanupDedup(long nowMs) {
        if (publicViewDedup.size() < 10_000) {
            return;
        }

        publicViewDedup.entrySet().removeIf(entry -> nowMs - entry.getValue() > PUBLIC_VIEW_DEDUP_TTL_MS);
    }

    private boolean isRedisDedupeEnabled() {
        return redisDedupeEnabled && redisTemplate != null;
    }

    private String hashFingerprint(String fingerprint) {
        return Integer.toHexString(fingerprint.hashCode());
    }
}
