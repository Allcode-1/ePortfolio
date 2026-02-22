package com.example.demo.controllers;

import com.example.demo.dto.CertificateRequest;
import com.example.demo.models.Certificate;
import com.example.demo.models.User;
import com.example.demo.services.CertificateService;
import com.example.demo.services.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {
    private final CertificateService certificateService;
    private final UserService userService;

    public CertificateController(CertificateService certificateService, UserService userService) {
        this.certificateService = certificateService;
        this.userService = userService;
    }

    @PostMapping
    public Certificate add(@RequestBody @Valid CertificateRequest request, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        return certificateService.addCertificate(user, request);
    }

    @GetMapping
    public List<Certificate> getAll(@AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        return certificateService.getUserCertificates(user);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        certificateService.deleteCertificate(id, user);
    }
}