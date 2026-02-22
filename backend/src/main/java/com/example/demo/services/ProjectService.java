package com.example.demo.services;

import com.example.demo.dto.ProjectDTO;
import com.example.demo.models.Project;
import com.example.demo.models.User;
import com.example.demo.repositories.ProjectRepository;
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
}