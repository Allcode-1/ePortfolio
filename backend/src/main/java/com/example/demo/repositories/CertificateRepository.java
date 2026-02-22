package com.example.demo.repositories;

import com.example.demo.models.Certificate;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByUser(User user);
    long countByUser(User user); // for counter in dashboard
    
}