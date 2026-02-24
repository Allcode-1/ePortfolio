package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectDTO {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100)
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String imageUrl;
    private String githubUrl;
    private String liveUrl;
    private String role;
    private String stackSummary;
    private String projectType;
    private String status;
    private LocalDate startedAt;
    private LocalDate finishedAt;
    private boolean isPinned;
}
