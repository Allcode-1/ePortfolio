package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectDTO {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100)
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String imageUrl;
    private String githubUrl;
    private boolean isPinned;
}