package com.example.demo.services;

import com.example.demo.dto.cv.CVSaveRequest;
import com.example.demo.dto.cv.EducationDTO;
import com.example.demo.dto.cv.ExperienceDTO;
import com.example.demo.enums.NotificationType;
import com.example.demo.models.CV;
import com.example.demo.models.User;
import com.example.demo.repositories.CVRepository;
import com.example.demo.repositories.EducationRepository;
import com.example.demo.repositories.ExperienceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
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
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CVServiceTest {

    @Mock
    private CVRepository cvRepository;
    @Mock
    private ExperienceRepository experienceRepository;
    @Mock
    private EducationRepository educationRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CVService cvService;

    @Test
    void saveOrUpdateCV_createsNewCv_savesRelations_andSendsNotification() {
        User user = user("user-1");
        CVSaveRequest request = requestWithAllFields();

        when(cvRepository.findByUser(user)).thenReturn(Optional.empty());
        when(cvRepository.save(any(CV.class))).thenAnswer(invocation -> {
            CV cv = invocation.getArgument(0);
            cv.setId(100L);
            return cv;
        });

        CV saved = cvService.saveOrUpdateCV(user, request);

        assertThat(saved.getId()).isEqualTo(100L);
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getProfession()).isEqualTo("Backend Developer");
        assertThat(saved.getContactEmail()).isEqualTo("dev@example.com");
        assertThat(saved.getSkills()).containsExactly("Java", "Spring");

        verify(experienceRepository, never()).deleteByCv(any(CV.class));
        verify(educationRepository, never()).deleteByCv(any(CV.class));
        verify(experienceRepository, times(1)).save(any());
        verify(educationRepository, times(1)).save(any());
        verify(notificationService).createOnce(
            eq(user),
            eq(NotificationType.FIRST_CV_CREATED),
            eq("First CV created"),
            eq("Great start. Your first CV is saved and ready for sharing.")
        );
    }

    @Test
    void saveOrUpdateCV_updatesExistingCv_cleansOldRelations_andSkipsNotification() {
        User user = user("user-1");
        CV existingCv = new CV();
        existingCv.setId(10L);
        existingCv.setUser(user);

        CVSaveRequest request = requestWithAllFields();
        request.setProfession("Senior Backend Developer");
        request.setSkills(List.of("Java", "Spring Boot", "PostgreSQL"));

        when(cvRepository.findByUser(user)).thenReturn(Optional.of(existingCv));
        when(cvRepository.save(existingCv)).thenReturn(existingCv);

        CV saved = cvService.saveOrUpdateCV(user, request);

        assertThat(saved.getId()).isEqualTo(10L);
        assertThat(saved.getProfession()).isEqualTo("Senior Backend Developer");
        assertThat(saved.getSkills()).containsExactly("Java", "Spring Boot", "PostgreSQL");

        verify(experienceRepository).deleteByCv(existingCv);
        verify(educationRepository).deleteByCv(existingCv);
        verify(experienceRepository, times(1)).save(any());
        verify(educationRepository, times(1)).save(any());
        verify(notificationService, never()).createOnce(any(), any(), any(), any());
    }

    @Test
    void saveOrUpdateCV_whenNoExperienceOrEducation_doesNotSaveChildEntities() {
        User user = user("user-2");
        CVSaveRequest request = requestWithAllFields();
        request.setExperiences(null);
        request.setEducations(null);

        when(cvRepository.findByUser(user)).thenReturn(Optional.empty());
        when(cvRepository.save(any(CV.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CV saved = cvService.saveOrUpdateCV(user, request);

        assertThat(saved.getProfession()).isEqualTo("Backend Developer");
        verify(experienceRepository, never()).save(any());
        verify(educationRepository, never()).save(any());
    }

    @Test
    void deleteCV_existingCv_deletesChildrenThenCv() {
        User user = user("user-3");
        CV cv = new CV();
        cv.setId(55L);
        cv.setUser(user);

        when(cvRepository.findByUser(user)).thenReturn(Optional.of(cv));

        cvService.deleteCV(user);

        InOrder inOrder = inOrder(experienceRepository, educationRepository, cvRepository);
        inOrder.verify(experienceRepository).deleteByCv(cv);
        inOrder.verify(educationRepository).deleteByCv(cv);
        inOrder.verify(cvRepository).delete(cv);
    }

    @Test
    void deleteCV_whenCvMissing_throwsRuntimeException() {
        User user = user("user-4");
        when(cvRepository.findByUser(user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cvService.deleteCV(user))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(responseStatusException.getReason()).isEqualTo("CV not found for this user");
            });

        verify(experienceRepository, never()).deleteByCv(any(CV.class));
        verify(educationRepository, never()).deleteByCv(any(CV.class));
        verify(cvRepository, never()).delete(any(CV.class));
    }

    private User user(String id) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        return user;
    }

    private CVSaveRequest requestWithAllFields() {
        ExperienceDTO experienceDTO = new ExperienceDTO();
        experienceDTO.setCompany("Acme");
        experienceDTO.setPosition("Java Developer");
        experienceDTO.setPeriod("2022-2024");

        EducationDTO educationDTO = new EducationDTO();
        educationDTO.setInstitution("IT University");
        educationDTO.setDegree("BSc CS");
        educationDTO.setYear("2021");

        CVSaveRequest request = new CVSaveRequest();
        request.setProfession("Backend Developer");
        request.setContactEmail("dev@example.com");
        request.setCity("Almaty");
        request.setPhone("+77000000000");
        request.setSkills(List.of("Java", "Spring"));
        request.setExperiences(List.of(experienceDTO));
        request.setEducations(List.of(educationDTO));
        return request;
    }
}
