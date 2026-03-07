package com.example.demo.services;

import com.example.demo.dto.ai.AiImproveRequest;
import com.example.demo.exceptions.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiAssistantServiceTest {

    @Test
    void improveCvText_whenApiKeyMissing_throwsApiException() {
        AiAssistantService service = new AiAssistantService(new ObjectMapper());
        ReflectionTestUtils.setField(service, "openAiApiKey", "");

        AiImproveRequest request = new AiImproveRequest();
        request.setText("Sample CV text");
        request.setLanguage("en");

        assertThatThrownBy(() -> service.improveCvText(request))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> {
                ApiException apiException = (ApiException) ex;
                assertThat(apiException.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                assertThat(apiException.getCode()).isEqualTo("AI_NOT_CONFIGURED");
            });
    }
}
