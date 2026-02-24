package com.example.demo.controllers;

import com.example.demo.dto.GithubRepoInfoResponse;
import com.example.demo.services.GithubService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/github")
public class GithubController {
    private final GithubService githubService;

    public GithubController(GithubService githubService) {
        this.githubService = githubService;
    }

    @GetMapping("/repo-info")
    public GithubRepoInfoResponse getRepoInfo(@RequestParam("url") String repoUrl) {
        return githubService.fetchRepoInfo(repoUrl);
    }
}
