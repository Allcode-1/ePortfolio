package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GithubRepoInfoResponse {
    private String fullName;
    private String name;
    private String description;
    private String htmlUrl;
    private int stars;
    private int forks;
    private String language;
    private String ownerAvatarUrl;
}
