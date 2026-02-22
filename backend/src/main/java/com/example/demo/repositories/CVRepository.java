package com.example.demo.repositories;

import com.example.demo.models.CV;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CVRepository extends JpaRepository<CV, Long> {
    Optional<CV> findByUser(User user);
}