package com.example.demo.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "certificates")
@Data 
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String issuedBy;
    private String imageUrl;
    private String issueDate;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}