package com.example.demo.services;

import com.example.demo.dto.ProjectDTO;
import com.example.demo.models.Project;
import com.example.demo.models.User;
import com.example.demo.repositories.ProjectRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public Project createProject(User user, ProjectDTO dto) {
        Project project = new Project();
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setImageUrl(dto.getImageUrl());
        project.setGithubUrl(dto.getGithubUrl());
        project.setPinned(dto.isPinned());
        project.setUser(user);
        return projectRepository.save(project);
    }

    public List<Project> getUserProjects(User user) {
        return projectRepository.findByUser(user);
    }

    @Transactional
    public Project updateProject(Long id, ProjectDTO dto, User user) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You are not the owner of this project");
        }

        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setImageUrl(dto.getImageUrl());
        project.setGithubUrl(dto.getGithubUrl());
        project.setPinned(dto.isPinned());

        return projectRepository.save(project);
    }

    public void deleteProject(Long id, User user) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You cannot delete this project");
        }

        projectRepository.delete(project);
    }
}