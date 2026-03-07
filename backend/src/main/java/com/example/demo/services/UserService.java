package com.example.demo.services;

import com.example.demo.dto.PortfolioResponse;
import com.example.demo.dto.user.UserSettingsResponse;
import com.example.demo.enums.NotificationType;
import com.example.demo.models.User;
import com.example.demo.repositories.*;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

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
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PortfolioResponse response = new PortfolioResponse();
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        
        response.setCv(cvRepository.findByUser(user).orElse(null));
        response.setProjects(projectRepository.findByUser(user));
        response.setCertificates(certificateRepository.findByUser(user));

        return response;
    }

    public PortfolioResponse getPublicPortfolio(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Public profile not found"));

        if (!user.isPublic()) {
            log.info("Blocked private profile access for userId={}", userId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Public profile not found");
        }

        PortfolioResponse response = new PortfolioResponse();
        response.setFullName(user.getFullName());
        response.setEmail(null);
        response.setCv(cvRepository.findByUser(user).orElse(null));
        response.setProjects(projectRepository.findByUser(user));
        response.setCertificates(certificateRepository.findByUser(user));
        return response;
    }

    public UserSettingsResponse getSettings(User user) {
        return new UserSettingsResponse(user.isPublic() ? "public" : "private");
    }

    @Transactional
    public UserSettingsResponse updateSettings(User user, String accountVisibility) {
        boolean nextPublic = "public".equalsIgnoreCase(accountVisibility);
        user.setPublic(nextPublic);
        userRepository.save(user);
        log.info("Updated account visibility for userId={} to {}", user.getId(), nextPublic ? "public" : "private");
        return getSettings(user);
    }

    @Transactional
    public void deleteUser(String clerkId) {
        User user = userRepository.findById(clerkId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        userRepository.delete(user);
    }
}
