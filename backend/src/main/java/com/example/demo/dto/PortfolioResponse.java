package com.example.demo.dto;

import com.example.demo.models.*;
import lombok.Data;
import java.util.List;

@Data
public class PortfolioResponse {
    private String fullName;
    private String email;
    private CV cv;
    private List<Project> projects;
    private List<Certificate> certificates;
}