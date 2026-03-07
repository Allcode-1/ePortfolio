package com.example.demo.services;

import com.example.demo.exceptions.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {
    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);

    private record Bucket(long windowStartEpochSec, int count) {}

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;

    @Value("${app.ratelimit.redis.enabled:false}")
    private boolean redisEnabled;

    public RateLimitService() {
        this.redisTemplate = null;
    }

    @Autowired
    public RateLimitService(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    public void check(String key, int limitPerWindow, int windowSeconds, String errorCode, String message) {
        if (limitPerWindow <= 0 || windowSeconds <= 0) {
            return;
        }

        if (isRedisEnabled()) {
            checkWithRedis(key, limitPerWindow, windowSeconds, errorCode, message);
            return;
        }

        checkWithInMemory(key, limitPerWindow, windowSeconds, errorCode, message);
    }

    private void checkWithRedis(String key, int limitPerWindow, int windowSeconds, String errorCode, String message) {
        long now = Instant.now().getEpochSecond();
        long windowStart = (now / windowSeconds) * windowSeconds;
        String redisKey = "ratelimit:" + key + ":" + windowStart;

        try {
            Long value = redisTemplate.opsForValue().increment(redisKey);
            if (value == null) {
                checkWithInMemory(key, limitPerWindow, windowSeconds, errorCode, message);
                return;
            }

            if (value == 1L) {
                redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds + 5L));
            }

            if (value > limitPerWindow) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, errorCode, message);
            }
        } catch (RuntimeException ex) {
            if (ex instanceof ApiException apiException) {
                throw apiException;
            }
            log.warn("Redis rate-limit fallback to in-memory due to error: {}", ex.getMessage());
            checkWithInMemory(key, limitPerWindow, windowSeconds, errorCode, message);
        }
    }

    private void checkWithInMemory(String key, int limitPerWindow, int windowSeconds, String errorCode, String message) {
        long now = Instant.now().getEpochSecond();
        long windowStart = (now / windowSeconds) * windowSeconds;

        Bucket updated = buckets.compute(key, (ignored, current) -> {
            if (current == null || current.windowStartEpochSec() != windowStart) {
                return new Bucket(windowStart, 1);
            }
            return new Bucket(windowStart, current.count() + 1);
        });

        cleanupIfNeeded(now, windowSeconds);

        if (updated.count() > limitPerWindow) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, errorCode, message);
        }
    }

    private boolean isRedisEnabled() {
        return redisEnabled && redisTemplate != null;
    }

    private void cleanupIfNeeded(long now, int windowSeconds) {
        if (buckets.size() < 5000) {
            return;
        }

        long minWindowStart = ((now - (windowSeconds * 2L)) / windowSeconds) * windowSeconds;
        buckets.entrySet().removeIf(entry -> entry.getValue().windowStartEpochSec() < minWindowStart);
    }
}
