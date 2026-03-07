package com.example.demo.controllers;

import com.example.demo.config.SecurityConfig;
import com.example.demo.dto.ai.AiImproveResponse;
import com.example.demo.services.AiAssistantService;
import com.example.demo.services.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiController.class)
@Import(SecurityConfig.class)
class AiControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AiAssistantService aiAssistantService;
    @MockBean
    private RateLimitService rateLimitService;
    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void improveCv_whenAuthorized_checksRateLimitAndReturnsResponse() throws Exception {
        when(aiAssistantService.improveCvText(org.mockito.ArgumentMatchers.any()))
            .thenReturn(new AiImproveResponse("text", "summary", List.of("a", "b", "c")));

        mockMvc.perform(post("/api/ai/cv/improve")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-7").claim("email", "ai@example.com")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Payload("source", "ctx", "en"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.improvedText").value("text"));

        verify(rateLimitService).check(
            contains("ai:user:clerk-7:scope:cv"),
            eq(30),
            eq(60),
            eq("AI_RATE_LIMIT"),
            eq("AI rate limit exceeded. Please wait and retry.")
        );
    }

    @Test
    void improveCv_whenUnauthorized_returns401() throws Exception {
        mockMvc.perform(post("/api/ai/cv/improve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Payload("source", "ctx", "en"))))
            .andExpect(status().isUnauthorized());
    }

    private record Payload(String text, String context, String language) {
    }
}
