package com.example.demo.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", "dchshqme1");
        config.put("api_key", "356732479694234");
        config.put("api_secret", "0TXIsdy0n20z0f6UqCjgDLP7m5A");
        return new Cloudinary(config);
    }
}