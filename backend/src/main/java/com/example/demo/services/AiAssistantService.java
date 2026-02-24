package com.example.demo.services;

import com.example.demo.dto.ai.AiImproveRequest;
import com.example.demo.dto.ai.AiImproveResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiAssistantService {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(40);
    private static final Duration CACHE_TTL = Duration.ofMinutes(20);
    private static final int MAX_TEXT_LENGTH = 5000;
    private static final int MAX_CONTEXT_LENGTH = 1200;
    private static final int MAX_HIGHLIGHTS = 3;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Map<String, CachedResponse> responseCache = new ConcurrentHashMap<>();

    @Value("${openai.api.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Value("${openai.api.model:gpt-4.1-mini}")
    private String openAiModel;

    @Value("${openai.api.max-retries:2}")
    private int openAiMaxRetries;

    public AiAssistantService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .build();
    }

    public AiImproveResponse improveCvText(AiImproveRequest request) {
        return improveText("CV", request);
    }

    public AiImproveResponse improveProjectText(AiImproveRequest request) {
        return improveText("PROJECT", request);
    }

    public AiImproveResponse improveCertificateText(AiImproveRequest request) {
        return improveText("CERTIFICATE", request);
    }

    private AiImproveResponse improveText(String domain, AiImproveRequest request) {
        if (!StringUtils.hasText(openAiApiKey)) {
            throw new RuntimeException("OPENAI_API_KEY is not configured on backend.");
        }

        String language = normalizeLanguage(request.getLanguage());
        String sourceText = normalizeSourceText(request.getText());
        String context = normalizeContext(request.getContext());

        String cacheKey = buildCacheKey(domain, language, context, sourceText);
        AiImproveResponse cached = getCachedResponse(cacheKey);
        if (cached != null) {
            return cached;
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", openAiModel);
        payload.put("temperature", 0.35);
        payload.putObject("response_format").put("type", "json_object");

        ArrayNode messages = payload.putArray("messages");
        messages.addObject()
            .put("role", "system")
            .put("content", buildSystemPrompt(domain));

        messages.addObject()
            .put("role", "user")
            .put("content", buildUserPrompt(domain, language, context, sourceText));

        String modelContent = callOpenAiWithRetry(payload);

        AiImproveResponse result;
        if (StringUtils.hasText(modelContent)) {
            try {
                result = parseAiJson(modelContent, language);
            } catch (IOException parseError) {
                result = buildFallbackResponse(sourceText, language, false);
            }
        } else {
            result = buildFallbackResponse(sourceText, language, true);
        }

        saveCachedResponse(cacheKey, result);
        return result;
    }

    private String callOpenAiWithRetry(ObjectNode payload) {
        int maxRetries = Math.max(0, openAiMaxRetries);
        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(normalizeBaseUrl(openAiBaseUrl) + "/chat/completions"))
            .timeout(REQUEST_TIMEOUT)
            .header("Authorization", "Bearer " + openAiApiKey.trim())
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload.toString(), StandardCharsets.UTF_8))
            .build();

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                HttpResponse<String> response = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
                );

                int status = response.statusCode();

                if (status >= 200 && status < 300) {
                    return extractContent(response.body());
                }

                boolean canRetry = attempt < maxRetries;

                if (status == 429) {
                    if (canRetry) {
                        sleep(resolveRetryDelay(response, attempt));
                        continue;
                    }
                    return null;
                }

                if (status >= 500 && canRetry) {
                    sleep(resolveBackoff(attempt));
                    continue;
                }

                throw new RuntimeException(buildOpenAiError(status, response.body()));
            } catch (IOException ex) {
                if (attempt < maxRetries) {
                    try {
                        sleep(resolveBackoff(attempt));
                    } catch (InterruptedException interruptedEx) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("AI request interrupted.", interruptedEx);
                    }
                    continue;
                }
                throw new RuntimeException("Failed to process AI response.", ex);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("AI request interrupted.", ex);
            }
        }

        return null;
    }

    private String extractContent(String body) throws IOException {
        JsonNode root = objectMapper.readTree(body);
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        if (!StringUtils.hasText(content)) {
            return null;
        }
        return content;
    }

    private String buildOpenAiError(int statusCode, String body) {
        String message = "OpenAI request failed with status " + statusCode + ".";

        if (!StringUtils.hasText(body)) {
            return message;
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            String apiMessage = root.path("error").path("message").asText("").trim();
            if (StringUtils.hasText(apiMessage)) {
                return message + " " + apiMessage;
            }
        } catch (Exception ignored) {
            // ignore parse errors and keep base message
        }

        return message;
    }

    private Duration resolveRetryDelay(HttpResponse<String> response, int attempt) {
        String header = response.headers().firstValue("retry-after").orElse("").trim();

        if (StringUtils.hasText(header)) {
            try {
                long seconds = Long.parseLong(header);
                if (seconds > 0) {
                    return Duration.ofSeconds(Math.min(seconds, 10));
                }
            } catch (NumberFormatException ignored) {
                // fallback to exponential backoff
            }
        }

        return resolveBackoff(attempt);
    }

    private Duration resolveBackoff(int attempt) {
        long millis = Math.min(8000L, 900L * (attempt + 1L) * (attempt + 1L));
        return Duration.ofMillis(Math.max(300L, millis));
    }

    private void sleep(Duration duration) throws InterruptedException {
        long millis = Math.max(1L, duration.toMillis());
        Thread.sleep(millis);
    }

    private AiImproveResponse parseAiJson(String content, String language) throws IOException {
        JsonNode parsed = objectMapper.readTree(content);

        String improvedText = parsed.path("improvedText").asText("");
        if (!StringUtils.hasText(improvedText)) {
            improvedText = parsed.path("improved_text").asText("");
        }
        if (!StringUtils.hasText(improvedText)) {
            improvedText = content;
        }

        String summary = parsed.path("summary").asText("");
        if (!StringUtils.hasText(summary)) {
            summary = defaultSummary(language, false);
        }

        List<String> highlights = new ArrayList<>();
        JsonNode highlightNode = parsed.path("highlights");

        if (highlightNode.isArray()) {
            highlightNode.forEach(item -> {
                String value = item.asText("").trim();
                if (!value.isEmpty() && highlights.size() < MAX_HIGHLIGHTS) {
                    highlights.add(value);
                }
            });
        }

        while (highlights.size() < MAX_HIGHLIGHTS) {
            highlights.add(defaultHighlight(language, highlights.size() + 1));
        }

        return new AiImproveResponse(cleanText(improvedText), summary, highlights);
    }

    private AiImproveResponse buildFallbackResponse(String sourceText, String language, boolean rateLimited) {
        String improvedText = cleanText(sourceText);
        String summary = defaultSummary(language, rateLimited);
        List<String> highlights = extractFallbackHighlights(improvedText, language);
        return new AiImproveResponse(improvedText, summary, highlights);
    }

    private List<String> extractFallbackHighlights(String sourceText, String language) {
        List<String> highlights = new ArrayList<>();

        if (StringUtils.hasText(sourceText)) {
            String[] parts = sourceText.split("[\\n.!?;]+");
            for (String part : parts) {
                String normalized = cleanText(part);
                if (normalized.length() < 8) {
                    continue;
                }
                highlights.add(normalized);
                if (highlights.size() == MAX_HIGHLIGHTS) {
                    break;
                }
            }
        }

        while (highlights.size() < MAX_HIGHLIGHTS) {
            highlights.add(defaultHighlight(language, highlights.size() + 1));
        }

        return highlights;
    }

    private String buildSystemPrompt(String domain) {
        return """
You are a senior portfolio writing assistant.

Task domain: %s
Return STRICT JSON object with keys:
- improvedText: string
- summary: string
- highlights: string[] (3 items)

Rules:
1) Keep the original facts. Do not invent companies, awards, dates, metrics or technologies.
2) Rewrite text to be clear, professional and result-oriented.
3) Keep language requested by user (ru or en). If not provided, use source text language.
4) No markdown, no code blocks, no extra keys.
""".formatted(domain);
    }

    private String buildUserPrompt(String domain, String language, String context, String sourceText) {
        return """
DOMAIN: %s
LANGUAGE: %s
CONTEXT: %s
SOURCE_TEXT:
%s
""".formatted(domain, language, context, sourceText);
    }

    private String normalizeBaseUrl(String value) {
        String base = value == null ? "https://api.openai.com/v1" : value.trim();
        if (base.endsWith("/")) {
            return base.substring(0, base.length() - 1);
        }
        return base;
    }

    private String normalizeLanguage(String language) {
        if ("ru".equalsIgnoreCase(language)) {
            return "ru";
        }
        if ("en".equalsIgnoreCase(language)) {
            return "en";
        }
        return "auto";
    }

    private String normalizeSourceText(String text) {
        String value = text == null ? "" : text.trim();
        if (value.length() > MAX_TEXT_LENGTH) {
            value = value.substring(0, MAX_TEXT_LENGTH);
        }
        return value;
    }

    private String normalizeContext(String context) {
        String value = StringUtils.hasText(context) ? context.trim() : "none";
        if (value.length() > MAX_CONTEXT_LENGTH) {
            return value.substring(0, MAX_CONTEXT_LENGTH);
        }
        return value;
    }

    private String cleanText(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }

        String normalized = text.replace('\r', ' ').replace('\n', ' ').replaceAll("\\s+", " ").trim();
        if (normalized.isEmpty()) {
            return normalized;
        }

        String first = normalized.substring(0, 1).toUpperCase();
        if (normalized.length() == 1) {
            return first;
        }

        return first + normalized.substring(1);
    }

    private String buildCacheKey(String domain, String language, String context, String sourceText) {
        return String.join("|", domain, language, context, sourceText);
    }

    private AiImproveResponse getCachedResponse(String key) {
        CachedResponse cached = responseCache.get(key);
        if (cached == null) {
            return null;
        }

        long age = System.currentTimeMillis() - cached.savedAtMs();
        if (age > CACHE_TTL.toMillis()) {
            responseCache.remove(key);
            return null;
        }

        return cached.response();
    }

    private void saveCachedResponse(String key, AiImproveResponse response) {
        responseCache.put(key, new CachedResponse(response, System.currentTimeMillis()));

        if (responseCache.size() > 400) {
            long now = System.currentTimeMillis();
            responseCache.entrySet().removeIf(entry -> now - entry.getValue().savedAtMs() > CACHE_TTL.toMillis());
        }
    }

    private String defaultSummary(String language, boolean rateLimited) {
        if ("ru".equalsIgnoreCase(language)) {
            if (rateLimited) {
                return "Достигнут лимит AI (429). Применена локальная обработка текста.";
            }
            return "Описание улучшено и структурировано.";
        }

        if (rateLimited) {
            return "AI rate limit reached (429). Local text processing was applied.";
        }
        return "Description was improved and structured.";
    }

    private String defaultHighlight(String language, int index) {
        if ("ru".equalsIgnoreCase(language)) {
            return "Ключевой пункт " + index;
        }
        return "Key point " + index;
    }

    private record CachedResponse(AiImproveResponse response, long savedAtMs) {
    }
}
