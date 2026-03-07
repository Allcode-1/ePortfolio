package com.example.demo.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@AllArgsConstructor
public class AnalyticsResponse {
    private long publicViews;
    private long shareClicks;
    private long projectDetailViews;
    private long certificateFileOpens;
    private long cvDownloads;
    private LocalDateTime lastUpdated;
    private Map<String, Long> monthlyActivity;
}
