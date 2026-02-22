package com.example.demo.controllers;

import com.example.demo.dto.cv.CVSaveRequest;
import com.example.demo.models.CV;
import com.example.demo.models.User;
import com.example.demo.services.CVService;
import com.example.demo.services.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cv")
public class CVController {
    private final CVService cvService;
    private final UserService userService;

    public CVController(CVService cvService, UserService userService) {
        this.cvService = cvService;
        this.userService = userService;
    }

    @PostMapping
    public CV saveMyCV(@RequestBody @Valid CVSaveRequest request, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(
            jwt.getSubject(), 
            jwt.getClaimAsString("email"), 
            "User"
        );
        return cvService.saveOrUpdateCV(user, request);
    }

    @DeleteMapping
    public void deleteMyCV(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        cvService.deleteCV(user);
}
}