package com.example.demo.controllers;

import com.example.demo.config.SecurityConfig;
import com.example.demo.exceptions.ApiException;
import com.example.demo.services.CloudinaryService;
import com.example.demo.services.RateLimitService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FileController.class)
@Import(SecurityConfig.class)
class FileControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CloudinaryService cloudinaryService;
    @MockBean
    private RateLimitService rateLimitService;
    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void upload_whenAuthorized_returnsUrlAndChecksRateLimit() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[] {1, 2});
        when(cloudinaryService.uploadFile(any())).thenReturn("https://cdn/file.png");

        mockMvc.perform(multipart("/api/files/upload")
                .file(file)
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "test@example.com"))))
            .andExpect(status().isOk())
            .andExpect(content().string("https://cdn/file.png"));

        verify(rateLimitService).check(
            contains("upload:user:clerk-1"),
            eq(20),
            eq(60),
            eq("UPLOAD_RATE_LIMIT"),
            eq("Upload rate limit exceeded. Please wait and retry.")
        );
    }

    @Test
    void upload_whenUnauthorized_returns401() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[] {1, 2});

        mockMvc.perform(multipart("/api/files/upload").file(file))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void upload_whenCloudinaryRejectsType_returnsStructuredError() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "bad.exe", "application/octet-stream", new byte[] {1, 2});
        when(cloudinaryService.uploadFile(any()))
            .thenThrow(new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "FILE_TYPE_NOT_ALLOWED", "Type is not allowed"));

        mockMvc.perform(multipart("/api/files/upload")
                .file(file)
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "test@example.com"))))
            .andExpect(status().isUnsupportedMediaType())
            .andExpect(jsonPath("$.code").value("FILE_TYPE_NOT_ALLOWED"))
            .andExpect(jsonPath("$.message").value("Type is not allowed"));
    }
}
