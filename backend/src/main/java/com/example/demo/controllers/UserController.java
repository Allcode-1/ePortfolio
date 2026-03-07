package com.example.demo.controllers;

import com.example.demo.dto.user.UpdateUserSettingsRequest;
import com.example.demo.dto.user.UserSettingsResponse;
import com.example.demo.models.User;
import com.example.demo.services.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me/settings")
    public UserSettingsResponse getMySettings(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        return userService.getSettings(user);
    }

    @PatchMapping("/me/settings")
    public UserSettingsResponse updateMySettings(
        @RequestBody @Valid UpdateUserSettingsRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        return userService.updateSettings(user, request.getAccountVisibility());
    }

    @DeleteMapping("/me")
    public void deleteAccount(@AuthenticationPrincipal Jwt jwt) {
        userService.deleteUser(jwt.getSubject());
    }
}
