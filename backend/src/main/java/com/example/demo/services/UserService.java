package com.example.demo.services;

import com.example.demo.dto.PortfolioResponse;
import com.example.demo.models.User;
import com.example.demo.repositories.*;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final CVRepository cvRepository;
    private final CertificateRepository certificateRepository;

    public UserService(UserRepository userRepository, 
                       ProjectRepository projectRepository, 
                       CVRepository cvRepository, 
                       CertificateRepository certificateRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.cvRepository = cvRepository;
        this.certificateRepository = certificateRepository;
    }

    public User getOrCreateUser(String clerkId, String email, String fullName) {
        return userRepository.findById(clerkId).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(clerkId);
            newUser.setEmail(email);
            newUser.setFullName(fullName);
            newUser.setPublic(false); // by default: profile is hidden
            return userRepository.save(newUser);
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
}