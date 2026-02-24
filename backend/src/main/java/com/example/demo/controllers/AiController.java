package com.example.demo.controllers;

import com.example.demo.dto.ai.AiImproveRequest;
import com.example.demo.dto.ai.AiImproveResponse;
import com.example.demo.services.AiAssistantService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiAssistantService aiAssistantService;

    public AiController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/cv/improve")
    public AiImproveResponse improveCv(@RequestBody @Valid AiImproveRequest request) {
        return aiAssistantService.improveCvText(request);
    }

    @PostMapping("/project/improve")
    public AiImproveResponse improveProject(@RequestBody @Valid AiImproveRequest request) {
        return aiAssistantService.improveProjectText(request);
    }

    @PostMapping("/certificate/improve")
    public AiImproveResponse improveCertificate(@RequestBody @Valid AiImproveRequest request) {
        return aiAssistantService.improveCertificateText(request);
    }
}
