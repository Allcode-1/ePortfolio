package com.example.demo.controllers;

import com.example.demo.services.RateLimitService;
import com.example.demo.services.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    private final CloudinaryService cloudinaryService;
    private final RateLimitService rateLimitService;

    @Value("${app.ratelimit.upload.per-minute:20}")
    private int uploadPerMinuteLimit;

    public FileController(CloudinaryService cloudinaryService, RateLimitService rateLimitService) {
        this.cloudinaryService = cloudinaryService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public String upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt 
    ) {
        String clerkId = jwt.getSubject();
        rateLimitService.check(
            "upload:user:" + clerkId,
            uploadPerMinuteLimit,
            60,
            "UPLOAD_RATE_LIMIT",
            "Upload rate limit exceeded. Please wait and retry."
        );

        String url = cloudinaryService.uploadFile(file);
        log.info("File uploaded successfully for user={} sizeBytes={}", clerkId, file.getSize());
        return url;
    }
}
