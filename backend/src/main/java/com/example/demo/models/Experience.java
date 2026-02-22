package com.example.demo.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Experience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String company;
    private String position;
    private String period; // example: "Jan 2020 - Dec 2021"
    
    @ManyToOne
    @JoinColumn(name = "cv_id")
    private CV cv;
}