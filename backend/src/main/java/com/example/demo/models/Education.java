package com.example.demo.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Education {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String institution; // University/College name
    private String degree;      // degree/specialization
    private String year;        // graduation year
    
    @ManyToOne
    @JoinColumn(name = "cv_id")
    @JsonIgnore
    private CV cv;
}