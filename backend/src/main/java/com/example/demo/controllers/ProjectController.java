package com.example.demo.controllers;

import com.example.demo.models.Project;
import com.example.demo.models.User;
import com.example.demo.repositories.ProjectRepository;
import com.example.demo.services.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin("*")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    public ProjectController(ProjectRepository projectRepository, UserService userService) {
        this.projectRepository = projectRepository;
        this.userService = userService;
    }

    @PostMapping
    public Project createProject(@RequestBody Project project, @AuthenticationPrincipal Jwt jwt) {
        // get or create user in our db based on clerk token
        String clerkId = jwt.getSubject();
        String email = jwt.getClaimAsString("email"); 
        
        User user = userService.getOrCreateUser(clerkId, email, "New User");
        
        // link project to user
        project.setUser(user);
        
        // save to postgres
        return projectRepository.save(project);
    }

    @GetMapping
    public List<Project> getMyProjects(@AuthenticationPrincipal Jwt jwt) {
        return projectRepository.findAll(); 
    }
}