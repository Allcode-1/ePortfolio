package com.example.demo.services;

import com.example.demo.dto.PortfolioResponse;
import com.example.demo.enums.NotificationType;
import com.example.demo.models.User;
import com.example.demo.repositories.*;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final CVRepository cvRepository;
    private final CertificateRepository certificateRepository;
    private final NotificationService notificationService;

    public UserService(UserRepository userRepository, 
                       ProjectRepository projectRepository, 
                       CVRepository cvRepository, 
                       CertificateRepository certificateRepository,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.cvRepository = cvRepository;
        this.certificateRepository = certificateRepository;
        this.notificationService = notificationService;
    }

    public User getOrCreateUser(String clerkId, String email, String fullName) {
        return userRepository.findById(clerkId).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(clerkId);
            newUser.setEmail(email);
            newUser.setFullName(fullName);
            newUser.setPublic(false); // by default: profile is hidden
            User saved = userRepository.save(newUser);
            notificationService.createOnce(
                saved,
                NotificationType.WELCOME,
                "Welcome to ePortfolio",
                "Your workspace is ready. Start by adding your first CV, project or certificate."
            );
            return saved;
        });
    }

    public PortfolioResponse getFullPortfolio(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        PortfolioResponse response = new PortfolioResponse();
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        
        response.setCv(cvRepository.findByUser(user).orElse(null));
        response.setProjects(projectRepository.findByUser(user));
        response.setCertificates(certificateRepository.findByUser(user));

        return response;
    }

    @Transactional
    public void deleteUser(String clerkId) {
        User user = userRepository.findById(clerkId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        userRepository.delete(user);
    }
}
