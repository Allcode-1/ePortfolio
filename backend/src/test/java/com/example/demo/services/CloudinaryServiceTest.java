package com.example.demo.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.example.demo.exceptions.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    @Mock
    private Cloudinary cloudinary;
    @Mock
    private Uploader uploader;

    private CloudinaryService cloudinaryService;

    @BeforeEach
    void setUp() {
        cloudinaryService = new CloudinaryService(cloudinary);
        ReflectionTestUtils.setField(cloudinaryService, "maxUploadSizeBytes", 1024L);
    }

    @Test
    void uploadFile_whenFileEmpty_throwsApiException() {
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> cloudinaryService.uploadFile(file))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> assertThat(((ApiException) ex).getCode()).isEqualTo("FILE_EMPTY"));
    }

    @Test
    void uploadFile_whenFileTooLarge_throwsApiException() {
        byte[] content = new byte[2048];
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", content);

        assertThatThrownBy(() -> cloudinaryService.uploadFile(file))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> assertThat(((ApiException) ex).getCode()).isEqualTo("FILE_TOO_LARGE"));
    }

    @Test
    void uploadFile_whenUnsupportedType_throwsApiException() {
        MockMultipartFile file = new MockMultipartFile("file", "archive.zip", "application/zip", new byte[] {1, 2});

        assertThatThrownBy(() -> cloudinaryService.uploadFile(file))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> assertThat(((ApiException) ex).getCode()).isEqualTo("FILE_TYPE_NOT_ALLOWED"));
    }

    @Test
    void uploadFile_whenSignatureDoesNotMatchExtension_throwsApiException() {
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", pngBytes());

        assertThatThrownBy(() -> cloudinaryService.uploadFile(file))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> assertThat(((ApiException) ex).getCode()).isEqualTo("FILE_SIGNATURE_MISMATCH"));
    }

    @Test
    void uploadFile_whenUploadSucceeds_returnsUrl() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", pngBytes());
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of("secure_url", "https://cdn/file.png"));

        String url = cloudinaryService.uploadFile(file);

        assertThat(url).isEqualTo("https://cdn/file.png");
    }

    @Test
    void uploadFile_whenCloudinaryIoError_throwsApiException() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", pngBytes());
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenThrow(new IOException("network"));

        assertThatThrownBy(() -> cloudinaryService.uploadFile(file))
            .isInstanceOf(ApiException.class)
            .satisfies(ex -> assertThat(((ApiException) ex).getCode()).isEqualTo("CLOUDINARY_UPLOAD_IO_ERROR"));
    }

    @Test
    void uploadFile_whenPdfFile_usesRawCloudinaryResourceType() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", pdfBytes());
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of("secure_url", "https://cdn/resume.pdf"));

        cloudinaryService.uploadFile(file);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> optionsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(uploader).upload(any(byte[].class), optionsCaptor.capture());
        Map<String, Object> options = optionsCaptor.getValue();
        assertThat(options.get("resource_type")).isEqualTo("raw");
        assertThat(options.get("type")).isEqualTo("upload");
    }

    private byte[] pngBytes() {
        return new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01, 0x02};
    }

    private byte[] pdfBytes() {
        return new byte[] {'%', 'P', 'D', 'F', '-', '1', '.', '7'};
    }
}
