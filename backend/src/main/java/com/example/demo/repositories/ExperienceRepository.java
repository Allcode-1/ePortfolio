package com.example.demo.repositories;

import com.example.demo.models.CV;
import com.example.demo.models.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    void deleteByCv(CV cv);
}