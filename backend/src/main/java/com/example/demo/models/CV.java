package com.example.demo.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "cvs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CV {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String profession;
    private Double expectedSalary;
    
    // if info diff from user profiile
    private String contactEmail;
    private String phone;
    private String city;
    private String citizenship;
    private String birthDate;

    @ElementCollection
    @CollectionTable(name = "cv_skills", joinColumns = @JoinColumn(name = "cv_id"))
    @Column(name = "skill")
    private List<String> skills;

    @OneToMany(mappedBy = "cv", cascade = CascadeType.ALL)
    private List<Experience> experiences;

    @OneToMany(mappedBy = "cv", cascade = CascadeType.ALL)
    private List<Education> educations;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}