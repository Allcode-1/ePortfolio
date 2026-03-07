package com.example.demo.models;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "portfolio_analytics")
@Getter
@Setter
@NoArgsConstructor
public class PortfolioAnalytics {
    @Id
    @Column(name = "user_id", nullable = false, length = 128)
    private String userId;

    @Column(nullable = false)
    private long publicViews = 0L;

    @Column(nullable = false)
    private long shareClicks = 0L;

    @Column(nullable = false)
    private long projectDetailViews = 0L;

    @Column(nullable = false)
    private long certificateFileOpens = 0L;

    @Column(nullable = false)
    private long cvDownloads = 0L;

    @ElementCollection
    @CollectionTable(name = "portfolio_analytics_monthly", joinColumns = @JoinColumn(name = "user_id"))
    @MapKeyColumn(name = "month_key", length = 7)
    @Column(name = "event_count", nullable = false)
    private Map<String, Long> monthlyActivity = new HashMap<>();

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastUpdated;
}
