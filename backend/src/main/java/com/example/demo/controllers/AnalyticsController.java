package com.example.demo.controllers;

import com.example.demo.dto.analytics.AnalyticsResponse;
import com.example.demo.models.User;
import com.example.demo.services.AnalyticsService;
import com.example.demo.services.RateLimitService;
import com.example.demo.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserService userService;
    private final RateLimitService rateLimitService;

    @Value("${app.ratelimit.public-view.per-minute:120}")
    private int publicViewPerMinuteLimit;

    public AnalyticsController(
        AnalyticsService analyticsService,
        UserService userService,
        RateLimitService rateLimitService
    ) {
        this.analyticsService = analyticsService;
        this.userService = userService;
        this.rateLimitService = rateLimitService;
    }

    @GetMapping("/me")
    public AnalyticsResponse getMyAnalytics(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        return analyticsService.getMyAnalytics(user);
    }

    @PostMapping("/me/events/{eventKey}")
    public AnalyticsResponse trackMyEvent(@PathVariable String eventKey, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        return analyticsService.incrementMyEvent(user, eventKey);
    }

    @PostMapping("/public-view/{userId}")
    public void trackPublicView(@PathVariable String userId, HttpServletRequest request) {
        String fingerprint = buildPublicViewerFingerprint(request);
        rateLimitService.check(
            "analytics:public-view:" + fingerprint,
            publicViewPerMinuteLimit,
            60,
            "PUBLIC_VIEW_RATE_LIMIT",
            "Public profile view rate limit exceeded. Please wait and retry."
        );
        analyticsService.incrementPublicView(userId, fingerprint);
    }

    private String buildPublicViewerFingerprint(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank()
            ? forwarded.split(",")[0].trim()
            : request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent") == null ? "" : request.getHeader("User-Agent");
        return ip + "|" + userAgent;
    }
}
