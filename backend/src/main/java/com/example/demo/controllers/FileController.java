package com.example.demo.controllers;

import com.example.demo.services.CloudinaryService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@CrossOrigin("*")
public class FileController {

    private final CloudinaryService cloudinaryService;

    public FileController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public String upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt 
    ) {
        String clerkId = jwt.getSubject();
        System.out.println("Файл загружает пользователь с ID: " + clerkId);
        return cloudinaryService.uploadFile(file);
    }
}