package com.example.demo.controllers;

import com.example.demo.dto.PortfolioResponse;
import com.example.demo.enums.NotificationType;
import com.example.demo.services.NotificationService;
import com.example.demo.services.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@CrossOrigin("*")
public class PublicController {

    private final UserService userService;
    private final NotificationService notificationService;

    public PublicController(UserService userService, NotificationService notificationService) {
        this.userService = userService;
        this.notificationService = notificationService;
    }

    // userid access (id from clerk)
    @GetMapping("/portfolio/{userId}")
    public PortfolioResponse getPortfolio(@PathVariable String userId) {
        PortfolioResponse response = userService.getFullPortfolio(userId);
        notificationService.createOnceByUserId(
            userId,
            NotificationType.FIRST_PUBLIC_PROFILE_VIEW,
            "Public profile viewed",
            "Someone opened your public portfolio page for the first time."
        );
        return response;
    }
}
