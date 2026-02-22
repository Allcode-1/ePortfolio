package com.example.demo.services;

import com.example.demo.models.*;
import com.example.demo.repositories.*;
import com.example.demo.dto.cv.CVSaveRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;

@Service
public class CVService {
    private final CVRepository cvRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository; // Добавили

    public CVService(CVRepository cvRepository, 
                     ExperienceRepository experienceRepository,
                     EducationRepository educationRepository) {
        this.cvRepository = cvRepository;
        this.experienceRepository = experienceRepository;
        this.educationRepository = educationRepository;
    }

    @Transactional
    public CV saveOrUpdateCV(User user, CVSaveRequest request) {
        CV cv = cvRepository.findByUser(user).orElse(new CV());
        cv.setUser(user);
        cv.setProfession(request.getProfession());
        cv.setContactEmail(request.getContactEmail());
        cv.setCity(request.getCity());
        cv.setPhone(request.getPhone());
        
        cv.setSkills(new ArrayList<>(request.getSkills()));

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
                edu.setDegree(dto.getDegree());
                edu.setYear(dto.getYear());
                edu.setCv(savedCv);
                educationRepository.save(edu);
            });
        }

        return savedCv;
    }
}