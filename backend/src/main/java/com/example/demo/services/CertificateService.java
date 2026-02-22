package com.example.demo.services;

import com.example.demo.models.Certificate;
import com.example.demo.models.User;
import com.example.demo.repositories.CertificateRepository;

import jakarta.transaction.Transactional;

import com.example.demo.dto.CertificateRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CertificateService {
    private final CertificateRepository certificateRepository;

    public CertificateService(CertificateRepository certificateRepository) {
        this.certificateRepository = certificateRepository;
    }

    public Certificate addCertificate(User user, CertificateRequest request) {
        Certificate cert = new Certificate();
        cert.setName(request.getName());
        cert.setIssuedBy(request.getIssuedBy());
        cert.setImageUrl(request.getImageUrl());
        cert.setIssueDate(request.getIssueDate());
        cert.setUser(user);
        
        return certificateRepository.save(cert);
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

        cert.setName(request.getName());
        cert.setIssuedBy(request.getIssuedBy());
        cert.setImageUrl(request.getImageUrl());
        cert.setIssueDate(request.getIssueDate());

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
}