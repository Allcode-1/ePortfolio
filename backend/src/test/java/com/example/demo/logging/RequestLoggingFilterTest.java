package com.example.demo.logging;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class RequestLoggingFilterTest {

    private final RequestLoggingFilter filter = new RequestLoggingFilter();

    @Test
    void doFilterInternal_whenRequestIdProvided_setsSameIdInResponse() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/portfolio/u1");
        request.addHeader("X-Request-Id", "abc-123_foo");
        request.addHeader("User-Agent", "JUnit");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader("X-Request-Id")).isEqualTo("abc-123_foo");
    }

    @Test
    void doFilterInternal_whenRequestIdContainsUnsafeChars_sanitizesValue() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/portfolio/u1");
        request.addHeader("X-Request-Id", "a<>b c\\n#%$@!");
        request.addHeader("User-Agent", "JUnit");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        String requestId = response.getHeader("X-Request-Id");
        assertThat(requestId).isNotBlank();
        assertThat(requestId).matches("[a-zA-Z0-9._-]{1,64}");
    }

    @Test
    void doFilterInternal_whenRequestIdMissing_generatesId() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/portfolio/u1");
        request.addHeader("User-Agent", "JUnit");
        request.setRemoteAddr("127.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        String requestId = response.getHeader("X-Request-Id");
        assertThat(requestId).isNotBlank();
        assertThat(requestId.length()).isLessThanOrEqualTo(64);
    }
}
