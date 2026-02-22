package com.example.demo.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "projects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    private String githubUrl;
    private String imageUrl; // cloudinary link
    private boolean isPinned = false;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}