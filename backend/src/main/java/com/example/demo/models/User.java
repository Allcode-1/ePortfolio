package com.example.demo.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    private String id; // clerk id
    
    private String email;
    private String nickname;
    private String fullName;
    private boolean isPublic = false;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Project> projects;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Certificate> certificates;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private CV pinnedCv;
}