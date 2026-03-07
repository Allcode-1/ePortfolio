package com.example.demo.services;

import com.example.demo.models.*;
import com.example.demo.repositories.*;
import com.example.demo.dto.cv.CVSaveRequest;
import com.example.demo.enums.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CVService {
    private final CVRepository cvRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository; // Добавили
    private final NotificationService notificationService;

    public CVService(CVRepository cvRepository, 
                     ExperienceRepository experienceRepository,
                     EducationRepository educationRepository,
                     NotificationService notificationService) {
        this.cvRepository = cvRepository;
        this.experienceRepository = experienceRepository;
        this.educationRepository = educationRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public CV saveOrUpdateCV(User user, CVSaveRequest request) {
        CV cv = cvRepository.findByUser(user).orElse(new CV());
        boolean isNewCv = cv.getId() == null;
        cv.setUser(user);
        cv.setProfession(request.getProfession());
        cv.setContactEmail(request.getContactEmail());
        cv.setCity(request.getCity());
        cv.setPhone(request.getPhone());

        List<String> normalizedSkills = request.getSkills() == null
            ? new ArrayList<>()
            : new ArrayList<>(request.getSkills());
        normalizedSkills.removeIf(skill -> skill == null || skill.isBlank());
        cv.setSkills(normalizedSkills);

        if (cv.getId() != null) {
            experienceRepository.deleteByCv(cv);
            educationRepository.deleteByCv(cv); 
        }

        CV savedCv = cvRepository.save(cv);

        if (request.getExperiences() != null) {
            request.getExperiences().forEach(dto -> {
                Experience exp = new Experience();
                exp.setCompany(dto.getCompany());
                exp.setPosition(dto.getPosition());
                exp.setPeriod(dto.getPeriod());
                exp.setCv(savedCv);
                experienceRepository.save(exp);
            });
        }

        if (request.getEducations() != null) {
            request.getEducations().forEach(dto -> {
                Education edu = new Education();
                edu.setInstitution(dto.getInstitution());
                edu.setProfession(dto.getProfession());
                edu.setDegree(dto.getDegree());
                edu.setYear(dto.getYear());
                edu.setCv(savedCv);
                educationRepository.save(edu);
            });
        }

        if (isNewCv) {
            notificationService.createOnce(
                user,
                NotificationType.FIRST_CV_CREATED,
                "First CV created",
                "Great start. Your first CV is saved and ready for sharing."
            );
        }

        return savedCv;
    }

    public CV getCV(User user) {
        return cvRepository.findByUser(user).orElse(null);
    }

    @Transactional
    public void deleteCV(User user) {
        CV cv = cvRepository.findByUser(user)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CV not found for this user"));
        
        experienceRepository.deleteByCv(cv);
        educationRepository.deleteByCv(cv);
        
        cvRepository.delete(cv);
    }
}
