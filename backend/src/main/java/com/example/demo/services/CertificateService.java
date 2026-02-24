package com.example.demo.services;

import com.example.demo.models.Certificate;
import com.example.demo.models.User;
import com.example.demo.enums.NotificationType;
import com.example.demo.repositories.CertificateRepository;

import jakarta.transaction.Transactional;

import com.example.demo.dto.CertificateRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CertificateService {
    private final CertificateRepository certificateRepository;
    private final NotificationService notificationService;

    public CertificateService(CertificateRepository certificateRepository, NotificationService notificationService) {
        this.certificateRepository = certificateRepository;
        this.notificationService = notificationService;
    }

    public Certificate addCertificate(User user, CertificateRequest request) {
        Certificate cert = new Certificate();
        applyRequest(cert, request);
        cert.setUser(user);
        Certificate saved = certificateRepository.save(cert);

        if (certificateRepository.countByUser(user) == 1L) {
            notificationService.createOnce(
                user,
                NotificationType.FIRST_CERTIFICATE_ADDED,
                "First certificate added",
                "Your first certificate is now part of your portfolio."
            );
        }

        return saved;
    }

    public List<Certificate> getUserCertificates(User user) {
        return certificateRepository.findByUser(user);
    }

    @Transactional
    public Certificate updateCertificate(Long id, CertificateRequest request, User user) {
        Certificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        if (!cert.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        applyRequest(cert, request);

        return certificateRepository.save(cert);
    }

    public void deleteCertificate(Long id, User user) {
        Certificate cert = certificateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sertificate not found"));
        
        if (!cert.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not enough permissions to delete this certificate");
        }
        
        certificateRepository.delete(cert);
    }

    private void applyRequest(Certificate cert, CertificateRequest request) {
        cert.setName(request.getName());
        cert.setTitle(request.getName());
        cert.setIssuedBy(request.getIssuedBy());
        cert.setImageUrl(request.getImageUrl());
        cert.setFileUrl(request.getImageUrl());
        cert.setIssueDate(request.getIssueDate());
        cert.setDescription(request.getDescription());
        cert.setCity(request.getCity());
        cert.setPlace(request.getPlace());
        cert.setEventName(request.getEventName());
        cert.setEventType(request.getEventType());
        cert.setImportance(request.getImportance() != null ? request.getImportance() : 0);
        cert.setPinned(request.getPinned() != null && request.getPinned());
    }
}
