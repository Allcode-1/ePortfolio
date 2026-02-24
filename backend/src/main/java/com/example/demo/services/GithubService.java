package com.example.demo.services;

import com.example.demo.dto.GithubRepoInfoResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GithubService {
    private static final Pattern REPO_URL_PATTERN = Pattern.compile("github\\.com/([^/\\s]+)/([^/\\s?#]+)", Pattern.CASE_INSENSITIVE);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${github.api.base-url:https://api.github.com}")
    private String githubApiBaseUrl;

    @Value("${github.api.token:}")
    private String githubApiToken;

    public GithubService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public GithubRepoInfoResponse fetchRepoInfo(String repoUrl) {
        RepoPath repoPath = extractRepoPath(repoUrl);

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create(String.format("%s/repos/%s/%s", githubApiBaseUrl, repoPath.owner(), repoPath.repo())))
            .timeout(Duration.ofSeconds(15))
            .header("Accept", "application/vnd.github+json")
            .GET();

        if (StringUtils.hasText(githubApiToken)) {
            requestBuilder.header("Authorization", "Bearer " + githubApiToken.trim());
        }

        try {
            HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                throw new RuntimeException("GitHub repository not found or API rate limit exceeded.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            return new GithubRepoInfoResponse(
                text(root, "full_name"),
                text(root, "name"),
                text(root, "description"),
                text(root, "html_url"),
                root.path("stargazers_count").asInt(0),
                root.path("forks_count").asInt(0),
                text(root, "language"),
                text(root.path("owner"), "avatar_url")
            );
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Failed to fetch GitHub repository details.", ex);
        }
    }

    private RepoPath extractRepoPath(String repoUrl) {
        if (!StringUtils.hasText(repoUrl)) {
            throw new RuntimeException("GitHub URL is required.");
        }

        String normalized = repoUrl.trim();
        Matcher matcher = REPO_URL_PATTERN.matcher(normalized);

        if (!matcher.find()) {
            throw new RuntimeException("Invalid GitHub URL. Example: https://github.com/owner/repository");
        }

        String owner = matcher.group(1);
        String repo = matcher.group(2).replaceAll("\\.git$", "");

        if (!StringUtils.hasText(owner) || !StringUtils.hasText(repo)) {
            throw new RuntimeException("Invalid GitHub URL. Example: https://github.com/owner/repository");
        }

        try {
            new URI("https://github.com/" + owner + "/" + repo);
        } catch (URISyntaxException ex) {
            throw new RuntimeException("Invalid GitHub URL. Example: https://github.com/owner/repository");
        }

        return new RepoPath(owner, repo);
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        return value.asText();
    }

    private record RepoPath(String owner, String repo) {
    }
}
