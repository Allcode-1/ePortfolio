package com.example.demo.controllers;

import com.example.demo.config.SecurityConfig;
import com.example.demo.dto.cv.CVSaveRequest;
import com.example.demo.models.CV;
import com.example.demo.models.User;
import com.example.demo.services.CVService;
import com.example.demo.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CVController.class)
@Import(SecurityConfig.class)
class CVControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CVService cvService;
    @MockBean
    private UserService userService;
    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void saveMyCV_whenPayloadValid_returnsSavedCv() throws Exception {
        User user = new User();
        user.setId("clerk-1");
        user.setEmail("test@example.com");

        CV savedCv = new CV();
        savedCv.setId(42L);
        savedCv.setProfession("Backend Developer");
        savedCv.setSkills(List.of("Java", "Spring"));

        when(userService.getOrCreateUser("clerk-1", "test@example.com", "User")).thenReturn(user);
        when(cvService.saveOrUpdateCV(eq(user), any(CVSaveRequest.class))).thenReturn(savedCv);

        mockMvc.perform(post("/api/cv")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "test@example.com")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(42))
            .andExpect(jsonPath("$.profession").value("Backend Developer"))
            .andExpect(jsonPath("$.skills[0]").value("Java"));

        ArgumentCaptor<CVSaveRequest> requestCaptor = ArgumentCaptor.forClass(CVSaveRequest.class);
        verify(cvService).saveOrUpdateCV(eq(user), requestCaptor.capture());
        assertThat(requestCaptor.getValue().getProfession()).isEqualTo("Backend Developer");
        assertThat(requestCaptor.getValue().getContactEmail()).isEqualTo("dev@example.com");
        assertThat(requestCaptor.getValue().getSkills()).containsExactly("Java", "Spring");
    }

    @Test
    void saveMyCV_whenContactEmailInvalid_returnsBadRequest() throws Exception {
        String invalidJson = """
            {
              "profession": "Backend Developer",
              "city": "Almaty",
              "contactEmail": "wrong-email",
              "phone": "+77000000000",
              "skills": ["Java"],
              "experiences": [{"company":"Acme","position":"Developer","period":"2024"}],
              "educations": [{"institution":"IT University","degree":"BSc","year":"2021"}]
            }
            """;

        mockMvc.perform(post("/api/cv")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-1").claim("email", "test@example.com")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.contactEmail").exists());

        verify(cvService, never()).saveOrUpdateCV(any(), any());
    }

    @Test
    void deleteMyCV_whenAuthorized_deletesUserCv() throws Exception {
        User user = new User();
        user.setId("clerk-2");
        user.setEmail("delete@example.com");

        when(userService.getOrCreateUser("clerk-2", "delete@example.com", "User")).thenReturn(user);

        mockMvc.perform(delete("/api/cv")
                .with(jwt().jwt(jwt -> jwt.subject("clerk-2").claim("email", "delete@example.com"))))
            .andExpect(status().isOk());

        verify(cvService).deleteCV(user);
    }

    @Test
    void saveMyCV_whenUnauthorized_returns401() throws Exception {
        mockMvc.perform(post("/api/cv")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson()))
            .andExpect(status().isUnauthorized());
    }

    private String validRequestJson() throws Exception {
        CVSaveRequest request = new CVSaveRequest();
        request.setProfession("Backend Developer");
        request.setCity("Almaty");
        request.setContactEmail("dev@example.com");
        request.setPhone("+77000000000");
        request.setSkills(List.of("Java", "Spring"));
        return objectMapper.writeValueAsString(request);
    }
}
