package com.example.demo.controllers;

import com.example.demo.dto.ProjectDTO;
import com.example.demo.models.Project;
import com.example.demo.models.User;
import com.example.demo.services.ProjectService;
import com.example.demo.services.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin("*")
public class ProjectController {

    private final ProjectService projectService;
    private final UserService userService;

    public ProjectController(ProjectService projectService, UserService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }

    @PostMapping
    public Project createProject(@RequestBody @Valid ProjectDTO projectDTO, @AuthenticationPrincipal Jwt jwt) {
        // get user from clerk token
        String clerkId = jwt.getSubject();
        String email = jwt.getClaimAsString("email"); 
        
        User user = userService.getOrCreateUser(clerkId, email, "New User");
        
        // create project through service
        return projectService.createProject(user, projectDTO);
    }

    @GetMapping
    public List<Project> getMyProjects(@AuthenticationPrincipal Jwt jwt) {
        // get user
        String clerkId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        User user = userService.getOrCreateUser(clerkId, email, "New User");

        // return only this user's projects
        return projectService.getUserProjects(user);
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Long id, @RequestBody @Valid ProjectDTO dto, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        return projectService.updateProject(id, dto, user);
    }

    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.getOrCreateUser(jwt.getSubject(), jwt.getClaimAsString("email"), "User");
        projectService.deleteProject(id, user);
    }
}