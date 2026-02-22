package com.example.demo.repositories;

import com.example.demo.models.Project;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUser(User user);
    List<Project> findByUserAndIsPinnedTrue(User user); // to get only pinned ones
}