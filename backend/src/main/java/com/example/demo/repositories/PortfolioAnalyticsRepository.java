package com.example.demo.repositories;

import com.example.demo.models.PortfolioAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioAnalyticsRepository extends JpaRepository<PortfolioAnalytics, String> {
}
