package com.example.demo.services;

import com.example.demo.exceptions.ApiException;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class RateLimitServiceTest {
    private final RateLimitService rateLimitService = new RateLimitService();

    @Test
    void check_whenUnderLimit_doesNotThrow() {
        assertThatNoException().isThrownBy(() ->
            rateLimitService.check("key-under-limit", 2, 60, "LIMIT", "Too many requests")
        );
    }

    @Test
    void check_whenLimitExceeded_throwsApiException() {
        rateLimitService.check("key-over-limit", 1, 60, "LIMIT", "Too many requests");

        assertThatThrownBy(() ->
            rateLimitService.check("key-over-limit", 1, 60, "LIMIT", "Too many requests")
        )
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> {
                ApiException apiException = (ApiException) ex;
                assertThat(apiException.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                assertThat(apiException.getCode()).isEqualTo("LIMIT");
            });
    }

    @Test
    void check_whenRedisEnabledAndUnderLimit_doesNotThrow() {
        StringRedisTemplate redisTemplate = Mockito.mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = Mockito.mock(ValueOperations.class);
        @SuppressWarnings("unchecked")
        ObjectProvider<StringRedisTemplate> provider = Mockito.mock(ObjectProvider.class);

        when(provider.getIfAvailable()).thenReturn(redisTemplate);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(any(String.class))).thenReturn(1L);
        when(redisTemplate.expire(any(String.class), any(Duration.class))).thenReturn(true);

        RateLimitService service = new RateLimitService(provider);
        ReflectionTestUtils.setField(service, "redisEnabled", true);

        assertThatNoException().isThrownBy(() ->
            service.check("redis-under-limit", 2, 60, "LIMIT", "Too many requests")
        );
    }

    @Test
    void check_whenRedisEnabledAndLimitExceeded_throwsApiException() {
        StringRedisTemplate redisTemplate = Mockito.mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = Mockito.mock(ValueOperations.class);
        @SuppressWarnings("unchecked")
        ObjectProvider<StringRedisTemplate> provider = Mockito.mock(ObjectProvider.class);

        when(provider.getIfAvailable()).thenReturn(redisTemplate);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(any(String.class))).thenReturn(5L);

        RateLimitService service = new RateLimitService(provider);
        ReflectionTestUtils.setField(service, "redisEnabled", true);

        assertThatThrownBy(() -> service.check("redis-over-limit", 2, 60, "LIMIT", "Too many requests"))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> {
                ApiException apiException = (ApiException) ex;
                assertThat(apiException.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                assertThat(apiException.getCode()).isEqualTo("LIMIT");
            });
    }

    @Test
    void check_whenRedisFails_fallsBackToInMemoryLimiter() {
        StringRedisTemplate redisTemplate = Mockito.mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = Mockito.mock(ValueOperations.class);
        @SuppressWarnings("unchecked")
        ObjectProvider<StringRedisTemplate> provider = Mockito.mock(ObjectProvider.class);

        when(provider.getIfAvailable()).thenReturn(redisTemplate);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(any(String.class))).thenThrow(new RuntimeException("redis down"));

        RateLimitService service = new RateLimitService(provider);
        ReflectionTestUtils.setField(service, "redisEnabled", true);

        service.check("redis-fallback", 1, 60, "LIMIT", "Too many requests");

        assertThatThrownBy(() -> service.check("redis-fallback", 1, 60, "LIMIT", "Too many requests"))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> {
                ApiException apiException = (ApiException) ex;
                assertThat(apiException.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                assertThat(apiException.getCode()).isEqualTo("LIMIT");
            });
    }
}
