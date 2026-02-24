package com.example.demo.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiImproveRequest {
    @NotBlank(message = "Text is required")
    private String text;

    private String context;
    private String language;
}
