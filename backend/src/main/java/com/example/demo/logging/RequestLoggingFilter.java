package com.example.demo.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.currentTimeMillis();
        String requestId = resolveRequestId(request);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        MDC.put("reqId", requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long elapsedMs = System.currentTimeMillis() - startedAt;
            log.info(
                "HTTP {} {} -> {} in {}ms ip={} ua={}",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                elapsedMs,
                resolveClientIp(request),
                trim(request.getHeader("User-Agent"), 120)
            );
            MDC.remove("reqId");
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String provided = request.getHeader(REQUEST_ID_HEADER);
        if (provided == null) {
            return UUID.randomUUID().toString().substring(0, 12);
        }

        String normalized = provided.trim();
        if (normalized.isEmpty()) {
            return UUID.randomUUID().toString().substring(0, 12);
        }

        String safe = normalized.replaceAll("[^a-zA-Z0-9._-]", "");
        if (safe.isEmpty()) {
            return UUID.randomUUID().toString().substring(0, 12);
        }

        return safe.length() > 64 ? safe.substring(0, 64) : safe;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isBlank()) {
                return first;
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private String trim(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
