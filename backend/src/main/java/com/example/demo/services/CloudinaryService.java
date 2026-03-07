package com.example.demo.services;

import com.cloudinary.Cloudinary;
import com.example.demo.exceptions.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class CloudinaryService {
    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".pdf");

    private enum DetectedFileType {
        JPEG,
        PNG,
        WEBP,
        PDF,
        UNKNOWN
    }

    private record ValidatedUpload(byte[] bytes, DetectedFileType detectedType) {}

    private final Cloudinary cloudinary;

    @Value("${files.upload.max-size-bytes:10485760}")
    private long maxUploadSizeBytes;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadFile(MultipartFile file) {
        ValidatedUpload validated = validateFile(file);

        try {
            Map<String, Object> options = new HashMap<>();

            if (validated.detectedType() == DetectedFileType.PDF) {
                options.put("resource_type", "raw");
                options.put("type", "upload");
            } else {
                options.put("resource_type", "image");
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(validated.bytes(), options);
            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl != null) {
                return secureUrl.toString();
            }

            Object url = uploadResult.get("url");
            if (url != null) {
                return url.toString();
            }

            throw new ApiException(
                HttpStatus.BAD_GATEWAY,
                "CLOUDINARY_EMPTY_RESPONSE",
                "File upload failed: provider did not return file URL."
            );
        } catch (IOException e) {
            log.error("Cloudinary upload IO error: {}", e.getMessage(), e);
            throw new ApiException(
                HttpStatus.BAD_GATEWAY,
                "CLOUDINARY_UPLOAD_IO_ERROR",
                "File upload failed due to upstream I/O error."
            );
        } catch (RuntimeException ex) {
            if (ex instanceof ApiException) {
                throw ex;
            }
            log.error("Cloudinary upload runtime error: {}", ex.getMessage(), ex);
            throw new ApiException(
                HttpStatus.BAD_GATEWAY,
                "CLOUDINARY_UPLOAD_ERROR",
                "File upload failed due to upstream provider error."
            );
        }
    }

    private ValidatedUpload validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_EMPTY", "Uploaded file is empty.");
        }

        if (file.getSize() > maxUploadSizeBytes) {
            throw new ApiException(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "FILE_TOO_LARGE",
                "Uploaded file exceeds max size limit."
            );
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_READ_ERROR", "Failed to read uploaded file.");
        }

        if (fileBytes.length == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_EMPTY", "Uploaded file is empty.");
        }

        String contentType = file.getContentType() == null
            ? ""
            : file.getContentType().toLowerCase(Locale.ROOT).trim();
        String fileName = file.getOriginalFilename() == null
            ? ""
            : file.getOriginalFilename().toLowerCase(Locale.ROOT).trim();
        DetectedFileType detectedType = detectFileType(fileBytes);

        if (detectedType == DetectedFileType.UNKNOWN) {
            throw new ApiException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "FILE_TYPE_NOT_ALLOWED",
                "Only JPEG, PNG, WEBP images and PDF files are allowed."
            );
        }

        boolean extensionAllowed = ALLOWED_EXTENSIONS.stream().anyMatch(fileName::endsWith);
        boolean contentTypeAllowed = ALLOWED_CONTENT_TYPES.contains(contentType);

        if (!fileName.isBlank() && !extensionAllowed) {
            throw new ApiException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "FILE_TYPE_NOT_ALLOWED",
                "Only JPEG, PNG, WEBP images and PDF files are allowed."
            );
        }

        if (!contentTypeAllowed && !extensionAllowed) {
            throw new ApiException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "FILE_TYPE_NOT_ALLOWED",
                "Only JPEG, PNG, WEBP images and PDF files are allowed."
            );
        }

        if (contentTypeAllowed && !contentTypeMatches(detectedType, contentType)) {
            throw new ApiException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "FILE_SIGNATURE_MISMATCH",
                "Uploaded file signature does not match content type."
            );
        }

        if (extensionAllowed && !extensionMatches(detectedType, fileName)) {
            throw new ApiException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "FILE_SIGNATURE_MISMATCH",
                "Uploaded file signature does not match file extension."
            );
        }

        return new ValidatedUpload(fileBytes, detectedType);
    }

    private DetectedFileType detectFileType(byte[] bytes) {
        if (isJpeg(bytes)) {
            return DetectedFileType.JPEG;
        }
        if (isPng(bytes)) {
            return DetectedFileType.PNG;
        }
        if (isWebp(bytes)) {
            return DetectedFileType.WEBP;
        }
        if (isPdf(bytes)) {
            return DetectedFileType.PDF;
        }
        return DetectedFileType.UNKNOWN;
    }

    private boolean contentTypeMatches(DetectedFileType detectedType, String contentType) {
        return switch (detectedType) {
            case JPEG -> "image/jpeg".equals(contentType);
            case PNG -> "image/png".equals(contentType);
            case WEBP -> "image/webp".equals(contentType);
            case PDF -> "application/pdf".equals(contentType);
            case UNKNOWN -> false;
        };
    }

    private boolean extensionMatches(DetectedFileType detectedType, String fileName) {
        return switch (detectedType) {
            case JPEG -> fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");
            case PNG -> fileName.endsWith(".png");
            case WEBP -> fileName.endsWith(".webp");
            case PDF -> fileName.endsWith(".pdf");
            case UNKNOWN -> false;
        };
    }

    private boolean isJpeg(byte[] bytes) {
        return bytes.length >= 3
            && (bytes[0] & 0xFF) == 0xFF
            && (bytes[1] & 0xFF) == 0xD8
            && (bytes[2] & 0xFF) == 0xFF;
    }

    private boolean isPng(byte[] bytes) {
        return bytes.length >= 8
            && (bytes[0] & 0xFF) == 0x89
            && (bytes[1] & 0xFF) == 0x50
            && (bytes[2] & 0xFF) == 0x4E
            && (bytes[3] & 0xFF) == 0x47
            && (bytes[4] & 0xFF) == 0x0D
            && (bytes[5] & 0xFF) == 0x0A
            && (bytes[6] & 0xFF) == 0x1A
            && (bytes[7] & 0xFF) == 0x0A;
    }

    private boolean isWebp(byte[] bytes) {
        return bytes.length >= 12
            && bytes[0] == 'R'
            && bytes[1] == 'I'
            && bytes[2] == 'F'
            && bytes[3] == 'F'
            && bytes[8] == 'W'
            && bytes[9] == 'E'
            && bytes[10] == 'B'
            && bytes[11] == 'P';
    }

    private boolean isPdf(byte[] bytes) {
        return bytes.length >= 4
            && bytes[0] == '%'
            && bytes[1] == 'P'
            && bytes[2] == 'D'
            && bytes[3] == 'F';
    }
}
