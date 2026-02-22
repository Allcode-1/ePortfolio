package com.example.demo.dto.cv;

import jakarta.validation.constraints.Email;
import lombok.Data;
import java.util.List;

@Data
public class CVSaveRequest {
    private String profession;
    private String city;
    @Email
    private String contactEmail;
    private String phone;
    private List<String> skills;
    private List<ExperienceDTO> experiences;
    private List<EducationDTO> educations;
}