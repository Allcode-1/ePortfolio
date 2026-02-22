package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CertificateRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Organization is required")
    private String issuedBy;

    @NotBlank(message = "File link is required")
    private String imageUrl; 

    private String issueDate;
}