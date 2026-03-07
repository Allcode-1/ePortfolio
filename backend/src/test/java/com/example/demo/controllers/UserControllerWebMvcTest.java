package com.example.demo.controllers;

import com.example.demo.config.SecurityConfig;
import com.example.demo.dto.user.UserSettingsResponse;
import com.example.demo.models.User;
import com.example.demo.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;
    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void getMySettings_whenAuthorized_returnsSettings() throws Exception {
        User user = new User();
        user.setId("clerk-1");
        when(userService.getOrCreateUser("clerk-1", "test@example.com", "User")).thenReturn(user);
        when(userService.getSettings(user)).thenReturn(new UserSettingsResponse("private"));

        mockMvc.perform(get("/api/users/me/settings")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "test@example.com"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountVisibility").value("private"));
    }

    @Test
    void updateMySettings_whenValid_returnsUpdatedSettings() throws Exception {
        User user = new User();
        user.setId("clerk-1");
        when(userService.getOrCreateUser("clerk-1", "test@example.com", "User")).thenReturn(user);
        when(userService.updateSettings(eq(user), eq("public"))).thenReturn(new UserSettingsResponse("public"));

        mockMvc.perform(patch("/api/users/me/settings")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "test@example.com")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Payload("public"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountVisibility").value("public"));
    }

    @Test
    void updateMySettings_whenInvalidVisibility_returnsBadRequest() throws Exception {
        mockMvc.perform(patch("/api/users/me/settings")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "test@example.com")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Payload("internal"))))
            .andExpect(status().isBadRequest());

        verify(userService, never()).updateSettings(any(), any());
    }

    private record Payload(String accountVisibility) {
    }
}
