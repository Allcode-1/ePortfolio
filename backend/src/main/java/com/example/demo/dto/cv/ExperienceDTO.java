package com.example.demo.dto.cv;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExperienceDTO {
    @NotBlank(message = "Company is required")
    private String company;
    @NotBlank(message = "Position is required")
    private String position;
    private String period; // for example: "Jan 2020 - Dec 2021"
}