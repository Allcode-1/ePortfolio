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
    private String description;
    private String city;
    private String place;
    private String eventName;
    private String eventType;
    private Integer importance;
    private Boolean pinned;
}
