package com.example.demo.services;

import com.example.demo.dto.ProjectDTO;
import com.example.demo.enums.NotificationType;
import com.example.demo.models.Project;
import com.example.demo.models.User;
import com.example.demo.repositories.ProjectRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;

    public ProjectService(ProjectRepository projectRepository, NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.notificationService = notificationService;
    }

    public Project createProject(User user, ProjectDTO dto) {
        Project project = new Project();
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setImageUrl(dto.getImageUrl());
        project.setGithubUrl(dto.getGithubUrl());
        project.setLiveUrl(dto.getLiveUrl());
        project.setRole(dto.getRole());
        project.setStackSummary(dto.getStackSummary());
        project.setProjectType(dto.getProjectType());
        project.setStatus(dto.getStatus());
        project.setStartedAt(dto.getStartedAt());
        project.setFinishedAt(dto.getFinishedAt());
        project.setPinned(dto.isPinned());
        project.setUser(user);
        Project saved = projectRepository.save(project);

        if (projectRepository.countByUser(user) == 1L) {
            notificationService.createOnce(
                user,
                NotificationType.FIRST_PROJECT_ADDED,
                "First project added",
                "Your portfolio has its first project card."
            );
        }

        return saved;
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
        project.setLiveUrl(dto.getLiveUrl());
        project.setRole(dto.getRole());
        project.setStackSummary(dto.getStackSummary());
        project.setProjectType(dto.getProjectType());
        project.setStatus(dto.getStatus());
        project.setStartedAt(dto.getStartedAt());
        project.setFinishedAt(dto.getFinishedAt());
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
