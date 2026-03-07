package com.example.demo.controllers;

import com.example.demo.config.SecurityConfig;
import com.example.demo.dto.analytics.AnalyticsResponse;
import com.example.demo.models.User;
import com.example.demo.services.AnalyticsService;
import com.example.demo.services.RateLimitService;
import com.example.demo.services.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@Import(SecurityConfig.class)
class AnalyticsControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;
    @MockBean
    private UserService userService;
    @MockBean
    private RateLimitService rateLimitService;
    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void getMyAnalytics_whenAuthorized_returnsPayload() throws Exception {
        User user = new User();
        user.setId("clerk-1");
        when(userService.getOrCreateUser("clerk-1", "u@example.com", "User")).thenReturn(user);
        when(analyticsService.getMyAnalytics(user)).thenReturn(
            new AnalyticsResponse(2, 3, 4, 5, 6, LocalDateTime.now(), Map.of("2026-03", 10L))
        );

        mockMvc.perform(get("/api/analytics/me")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "u@example.com"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.publicViews").value(2))
            .andExpect(jsonPath("$.shareClicks").value(3));
    }

    @Test
    void trackPublicView_whenAnonymous_isAllowedAndCallsService() throws Exception {
        mockMvc.perform(post("/api/analytics/public-view/owner-1")
                .header("User-Agent", "JUnit"))
            .andExpect(status().isOk());

        verify(rateLimitService).check(contains("analytics:public-view:"), anyInt(), eq(60), eq("PUBLIC_VIEW_RATE_LIMIT"), eq("Public profile view rate limit exceeded. Please wait and retry."));

        ArgumentCaptor<String> fingerprintCaptor = ArgumentCaptor.forClass(String.class);
        verify(analyticsService).incrementPublicView(eq("owner-1"), fingerprintCaptor.capture());
        assertThat(fingerprintCaptor.getValue()).contains("|JUnit");
    }

    @Test
    void trackMyEvent_whenUnauthorized_returns401() throws Exception {
        mockMvc.perform(post("/api/analytics/me/events/shareClicks"))
            .andExpect(status().isUnauthorized());
    }
}
