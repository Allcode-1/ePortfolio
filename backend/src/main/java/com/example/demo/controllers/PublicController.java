package com.example.demo.controllers;

import com.example.demo.dto.PortfolioResponse;
import com.example.demo.services.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@CrossOrigin("*")
public class PublicController {

    private final UserService userService;

    public PublicController(UserService userService) {
        this.userService = userService;
    }

    // userid access (id from clerk)
    @GetMapping("/portfolio/{userId}")
    public PortfolioResponse getPortfolio(@PathVariable String userId) {
        return userService.getFullPortfolio(userId);
    }
}