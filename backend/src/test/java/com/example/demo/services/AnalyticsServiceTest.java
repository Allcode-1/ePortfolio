package com.example.demo.services;

import com.example.demo.models.PortfolioAnalytics;
import com.example.demo.models.User;
import com.example.demo.repositories.PortfolioAnalyticsRepository;
import com.example.demo.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private PortfolioAnalyticsRepository analyticsRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void incrementPublicView_whenOwnerNotFound_throwsNotFound() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.incrementPublicView("missing", "viewer-1"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            });
    }

    @Test
    void incrementPublicView_whenOwnerPrivate_throwsNotFound() {
        User owner = new User();
        owner.setId("owner-private");
        owner.setPublic(false);
        when(userRepository.findById("owner-private")).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> analyticsService.incrementPublicView("owner-private", "viewer-1"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            });
    }

    @Test
    void incrementPublicView_whenPublicIncrementsCounter() {
        User owner = new User();
        owner.setId("owner-public");
        owner.setPublic(true);

        PortfolioAnalytics analytics = new PortfolioAnalytics();
        analytics.setUserId("owner-public");
        analytics.setPublicViews(5);

        when(userRepository.findById("owner-public")).thenReturn(Optional.of(owner));
        when(analyticsRepository.findById("owner-public")).thenReturn(Optional.of(analytics));
        when(analyticsRepository.save(any(PortfolioAnalytics.class))).thenAnswer(invocation -> invocation.getArgument(0));

        analyticsService.incrementPublicView("owner-public", "viewer-1");

        assertThat(analytics.getPublicViews()).isEqualTo(6);
        verify(analyticsRepository).save(analytics);
    }

    @Test
    void incrementPublicView_whenDuplicateFingerprint_skipsSecondIncrement() {
        User owner = new User();
        owner.setId("owner-public");
        owner.setPublic(true);

        PortfolioAnalytics analytics = new PortfolioAnalytics();
        analytics.setUserId("owner-public");
        analytics.setPublicViews(10);

        when(userRepository.findById("owner-public")).thenReturn(Optional.of(owner));
        when(analyticsRepository.findById("owner-public")).thenReturn(Optional.of(analytics));
        when(analyticsRepository.save(any(PortfolioAnalytics.class))).thenAnswer(invocation -> invocation.getArgument(0));

        analyticsService.incrementPublicView("owner-public", "viewer-1");
        analyticsService.incrementPublicView("owner-public", "viewer-1");

        assertThat(analytics.getPublicViews()).isEqualTo(11);
        verify(analyticsRepository).save(analytics);
    }

    @Test
    void incrementMyEvent_whenUnsupportedEvent_throwsBadRequest() {
        User user = new User();
        user.setId("owner-public");

        PortfolioAnalytics analytics = new PortfolioAnalytics();
        analytics.setUserId("owner-public");
        when(analyticsRepository.findById("owner-public")).thenReturn(Optional.of(analytics));

        assertThatThrownBy(() -> analyticsService.incrementMyEvent(user, "unknown"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            });
        verify(analyticsRepository, never()).save(any(PortfolioAnalytics.class));
    }

    @Test
    void incrementPublicView_whenRedisDedupeEnabled_skipsDuplicate() {
        User owner = new User();
        owner.setId("owner-public");
        owner.setPublic(true);

        PortfolioAnalytics analytics = new PortfolioAnalytics();
        analytics.setUserId("owner-public");
        analytics.setPublicViews(7);

        when(userRepository.findById("owner-public")).thenReturn(Optional.of(owner));
        when(analyticsRepository.findById("owner-public")).thenReturn(Optional.of(analytics));
        when(analyticsRepository.save(any(PortfolioAnalytics.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
            .thenReturn(true)
            .thenReturn(false);

        ReflectionTestUtils.setField(analyticsService, "redisTemplate", redisTemplate);
        ReflectionTestUtils.setField(analyticsService, "redisDedupeEnabled", true);

        analyticsService.incrementPublicView("owner-public", "viewer-1");
        analyticsService.incrementPublicView("owner-public", "viewer-1");

        assertThat(analytics.getPublicViews()).isEqualTo(8);
        verify(analyticsRepository).save(analytics);
    }

    @Test
    void incrementPublicView_whenRedisDedupeFails_fallsBackToInMemory() {
        User owner = new User();
        owner.setId("owner-public");
        owner.setPublic(true);

        PortfolioAnalytics analytics = new PortfolioAnalytics();
        analytics.setUserId("owner-public");
        analytics.setPublicViews(3);

        when(userRepository.findById("owner-public")).thenReturn(Optional.of(owner));
        when(analyticsRepository.findById("owner-public")).thenReturn(Optional.of(analytics));
        when(analyticsRepository.save(any(PortfolioAnalytics.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
            .thenThrow(new RuntimeException("redis unavailable"));

        ReflectionTestUtils.setField(analyticsService, "redisTemplate", redisTemplate);
        ReflectionTestUtils.setField(analyticsService, "redisDedupeEnabled", true);

        analyticsService.incrementPublicView("owner-public", "viewer-1");
        analyticsService.incrementPublicView("owner-public", "viewer-1");

        assertThat(analytics.getPublicViews()).isEqualTo(4);
        verify(analyticsRepository).save(analytics);
    }
}
