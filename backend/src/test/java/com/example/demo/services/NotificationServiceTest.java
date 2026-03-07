package com.example.demo.services;

import com.example.demo.enums.NotificationType;
import com.example.demo.models.Notification;
import com.example.demo.models.User;
import com.example.demo.repositories.NotificationRepository;
import com.example.demo.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
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
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void markAsRead_whenUnread_marksAsReadAndSetsReadAt() {
        User user = user("u-1");
        Notification notification = notification(false, NotificationType.WELCOME, user);

        when(notificationRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Notification result = notificationService.markAsRead(1L, user);

        assertThat(result.isRead()).isTrue();
        assertThat(result.getReadAt()).isNotNull();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_whenAlreadyRead_keepsExistingReadAt() {
        User user = user("u-2");
        Notification notification = notification(true, NotificationType.WELCOME, user);
        LocalDateTime originalReadAt = LocalDateTime.now().minusDays(1);
        notification.setReadAt(originalReadAt);

        when(notificationRepository.findByIdAndUser(2L, user)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Notification result = notificationService.markAsRead(2L, user);

        assertThat(result.isRead()).isTrue();
        assertThat(result.getReadAt()).isEqualTo(originalReadAt);
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_whenNotFound_throwsRuntimeException() {
        User user = user("u-3");
        when(notificationRepository.findByIdAndUser(3L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(3L, user))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(ex -> {
                ResponseStatusException responseStatusException = (ResponseStatusException) ex;
                assertThat(responseStatusException.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(responseStatusException.getReason()).isEqualTo("Notification not found");
            });
    }

    @Test
    void markAllAsRead_marksUnreadNotificationsAndSavesAll() {
        User user = user("u-4");
        Notification unread = notification(false, NotificationType.WELCOME, user);
        Notification alreadyRead = notification(true, NotificationType.FIRST_CV_CREATED, user);
        LocalDateTime readAt = LocalDateTime.now().minusHours(5);
        alreadyRead.setReadAt(readAt);

        List<Notification> notifications = List.of(unread, alreadyRead);
        when(notificationRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(notifications);

        notificationService.markAllAsRead(user);

        assertThat(unread.isRead()).isTrue();
        assertThat(unread.getReadAt()).isNotNull();
        assertThat(alreadyRead.getReadAt()).isEqualTo(readAt);
        verify(notificationRepository).saveAll(notifications);
    }

    @Test
    void createOnce_whenNotificationExists_skipsCreation() {
        User user = user("u-5");
        when(notificationRepository.existsByUserIdAndType("u-5", NotificationType.WELCOME)).thenReturn(true);

        notificationService.createOnce(user, NotificationType.WELCOME, "title", "message");

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void createOnce_whenNotificationMissing_createsNotification() {
        User user = user("u-6");
        when(notificationRepository.existsByUserIdAndType("u-6", NotificationType.WELCOME)).thenReturn(false);

        notificationService.createOnce(user, NotificationType.WELCOME, "Hello", "Welcome");

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createOnceByUserId_whenUserExists_createsNotificationOnce() {
        User user = user("u-7");
        when(userRepository.findById("u-7")).thenReturn(Optional.of(user));
        when(notificationRepository.existsByUserIdAndType("u-7", NotificationType.FIRST_PROJECT_ADDED))
            .thenReturn(false);

        notificationService.createOnceByUserId("u-7", NotificationType.FIRST_PROJECT_ADDED, "Title", "Message");

        verify(notificationRepository).existsByUserIdAndType("u-7", NotificationType.FIRST_PROJECT_ADDED);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createOnceByUserId_whenUserMissing_doesNothing() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        notificationService.createOnceByUserId("missing", NotificationType.FIRST_PROJECT_ADDED, "Title", "Message");

        verify(notificationRepository, never()).existsByUserIdAndType(any(), any());
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    private User user(String id) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        return user;
    }

    private Notification notification(boolean isRead, NotificationType type, User user) {
        Notification notification = new Notification();
        notification.setRead(isRead);
        notification.setType(type);
        notification.setTitle("Title");
        notification.setMessage("Message");
        notification.setUser(user);
        return notification;
    }
}
