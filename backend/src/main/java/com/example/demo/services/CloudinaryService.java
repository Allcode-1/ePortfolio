package com.example.demo.services;

import com.cloudinary.Cloudinary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadFile(MultipartFile file) {
        try {
            Map<String, Object> options = new HashMap<>();
            String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

            boolean isPdf = originalFileName.endsWith(".pdf") || contentType.contains("pdf");
            if (isPdf) {
                options.put("resource_type", "raw");
                options.put("type", "upload");
            } else {
                options.put("resource_type", "image");
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl != null) {
                return secureUrl.toString();
            }

            Object url = uploadResult.get("url");
            if (url != null) {
                return url.toString();
            }

            throw new RuntimeException("Cloudinary did not return file URL");
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при загрузке файла в Cloudinary", e);
        }
    }
}
