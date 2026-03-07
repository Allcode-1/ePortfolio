package com.example.demo.services;

import com.example.demo.dto.PortfolioResponse;
import com.example.demo.dto.user.UserSettingsResponse;
import com.example.demo.enums.NotificationType;
import com.example.demo.models.CV;
import com.example.demo.models.Certificate;
import com.example.demo.models.Project;
import com.example.demo.models.User;
import com.example.demo.repositories.CVRepository;
import com.example.demo.repositories.CertificateRepository;
import com.example.demo.repositories.ProjectRepository;
import com.example.demo.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private CertificateRepository certificateRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private UserService userService;

    @Test
    void getOrCreateUser_whenUserExists_returnsExistingUser() {
        User existing = new User();
        existing.setId("clerk-1");
        existing.setEmail("existing@example.com");

        when(userRepository.findById("clerk-1")).thenReturn(Optional.of(existing));

        User result = userService.getOrCreateUser("clerk-1", "new@example.com", "New Name");

        assertThat(result).isSameAs(existing);
        verify(userRepository, never()).save(any(User.class));
        verify(notificationService, never()).createOnce(any(), any(), any(), any());
    }

    @Test
    void getOrCreateUser_whenUserMissing_createsUserAndSendsWelcomeNotification() {
        when(userRepository.findById("clerk-2")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.getOrCreateUser("clerk-2", "new@example.com", "John Doe");

        assertThat(result.getId()).isEqualTo("clerk-2");
        assertThat(result.getEmail()).isEqualTo("new@example.com");
        assertThat(result.getFullName()).isEqualTo("John Doe");
        assertThat(result.isPublic()).isFalse();

        verify(notificationService).createOnce(
            eq(result),
            eq(NotificationType.WELCOME),
            eq("Welcome to ePortfolio"),
            eq("Your workspace is ready. Start by adding your first CV, project or certificate.")
        );
    }

    @Test
    void getFullPortfolio_returnsAggregatedPortfolioData() {
        User user = new User();
        user.setId("clerk-3");
        user.setFullName("Jane Doe");
        user.setEmail("jane@example.com");

        CV cv = new CV();
        cv.setId(1L);
        cv.setProfession("Backend Engineer");

        Project project = new Project();
        project.setId(7L);
        project.setTitle("Portfolio API");

        Certificate certificate = new Certificate();
        certificate.setId(9L);
        certificate.setTitle("Java Certificate");

        when(userRepository.findById("clerk-3")).thenReturn(Optional.of(user));
        when(cvRepository.findByUser(user)).thenReturn(Optional.of(cv));
        when(projectRepository.findByUser(user)).thenReturn(List.of(project));
        when(certificateRepository.findByUser(user)).thenReturn(List.of(certificate));

        PortfolioResponse response = userService.getFullPortfolio("clerk-3");

        assertThat(response.getFullName()).isEqualTo("Jane Doe");
        assertThat(response.getEmail()).isEqualTo("jane@example.com");
        assertThat(response.getCv()).isEqualTo(cv);
        assertThat(response.getProjects()).containsExactly(project);
        assertThat(response.getCertificates()).containsExactly(certificate);
    }

    @Test
    void getFullPortfolio_whenUserMissing_throwsRuntimeException() {
        when(userRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getFullPortfolio("unknown"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(responseStatusException.getReason()).isEqualTo("User not found");
            });
    }

    @Test
    void deleteUser_whenUserExists_deletesUser() {
        User user = new User();
        user.setId("clerk-4");

        when(userRepository.findById("clerk-4")).thenReturn(Optional.of(user));

        userService.deleteUser("clerk-4");

        verify(userRepository).delete(user);
    }

    @Test
    void deleteUser_whenUserMissing_throwsRuntimeException() {
        when(userRepository.findById("clerk-5")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser("clerk-5"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(responseStatusException.getReason()).isEqualTo("User not found");
            });

        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void getPublicPortfolio_whenProfileIsPrivate_throwsNotFound() {
        User privateUser = new User();
        privateUser.setId("private-user");
        privateUser.setPublic(false);

        when(userRepository.findById("private-user")).thenReturn(Optional.of(privateUser));

        assertThatThrownBy(() -> userService.getPublicPortfolio("private-user"))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(responseStatusException.getReason()).isEqualTo("Public profile not found");
            });
    }

    @Test
    void getPublicPortfolio_whenProfileIsPublic_hidesEmail() {
        User publicUser = new User();
        publicUser.setId("public-user");
        publicUser.setPublic(true);
        publicUser.setFullName("Visible User");
        publicUser.setEmail("visible@example.com");

        when(userRepository.findById("public-user")).thenReturn(Optional.of(publicUser));
        when(projectRepository.findByUser(publicUser)).thenReturn(List.of());
        when(certificateRepository.findByUser(publicUser)).thenReturn(List.of());
        when(cvRepository.findByUser(publicUser)).thenReturn(Optional.empty());

        PortfolioResponse response = userService.getPublicPortfolio("public-user");

        assertThat(response.getFullName()).isEqualTo("Visible User");
        assertThat(response.getEmail()).isNull();
    }

    @Test
    void updateSettings_updatesVisibilityAndReturnsDto() {
        User user = new User();
        user.setId("settings-user");
        user.setPublic(false);

        when(userRepository.save(user)).thenReturn(user);

        UserSettingsResponse response = userService.updateSettings(user, "public");

        assertThat(user.isPublic()).isTrue();
        assertThat(response.getAccountVisibility()).isEqualTo("public");
        verify(userRepository).save(user);
    }
}
