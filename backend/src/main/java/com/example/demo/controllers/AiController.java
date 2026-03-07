package com.example.demo.controllers;

import com.example.demo.dto.ai.AiImproveRequest;
import com.example.demo.dto.ai.AiImproveResponse;
import com.example.demo.services.AiAssistantService;
import com.example.demo.services.RateLimitService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiAssistantService aiAssistantService;
    private final RateLimitService rateLimitService;

    @Value("${app.ratelimit.ai.per-minute:30}")
    private int aiPerMinuteLimit;

    public AiController(AiAssistantService aiAssistantService, RateLimitService rateLimitService) {
        this.aiAssistantService = aiAssistantService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/cv/improve")
    public AiImproveResponse improveCv(@RequestBody @Valid AiImproveRequest request, @AuthenticationPrincipal Jwt jwt) {
        checkAiRateLimit(jwt.getSubject(), "cv");
        return aiAssistantService.improveCvText(request);
    }

    @PostMapping("/project/improve")
    public AiImproveResponse improveProject(@RequestBody @Valid AiImproveRequest request, @AuthenticationPrincipal Jwt jwt) {
        checkAiRateLimit(jwt.getSubject(), "project");
        return aiAssistantService.improveProjectText(request);
    }

    @PostMapping("/certificate/improve")
    public AiImproveResponse improveCertificate(@RequestBody @Valid AiImproveRequest request, @AuthenticationPrincipal Jwt jwt) {
        checkAiRateLimit(jwt.getSubject(), "certificate");
        return aiAssistantService.improveCertificateText(request);
    }

    private void checkAiRateLimit(String userId, String scope) {
        rateLimitService.check(
            "ai:user:" + userId + ":scope:" + scope,
            aiPerMinuteLimit,
            60,
            "AI_RATE_LIMIT",
            "AI rate limit exceeded. Please wait and retry."
        );
    }
}
