package com.example.demo.repositories;

import com.example.demo.enums.NotificationType;
import com.example.demo.models.Notification;
import com.example.demo.models.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class NotificationRepositoryIntegrationTest {

    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;

    @Test
    void existsByUserIdAndType_returnsTrueOnlyForSavedType() {
        User user = saveUser("n1");
        notificationRepository.saveAndFlush(notification(user, NotificationType.WELCOME, false));

        boolean existsWelcome = notificationRepository.existsByUserIdAndType("n1", NotificationType.WELCOME);
        boolean existsProject = notificationRepository.existsByUserIdAndType("n1", NotificationType.FIRST_PROJECT_ADDED);

        assertThat(existsWelcome).isTrue();
        assertThat(existsProject).isFalse();
    }

    @Test
    void countByUserIdAndIsReadFalse_countsOnlyUnreadForTargetUser() {
        User user = saveUser("n2");
        User otherUser = saveUser("n3");

        notificationRepository.saveAllAndFlush(List.of(
            notification(user, NotificationType.WELCOME, false),
            notification(user, NotificationType.FIRST_CV_CREATED, true),
            notification(user, NotificationType.FIRST_PROJECT_ADDED, false),
            notification(otherUser, NotificationType.WELCOME, false)
        ));

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse("n2");

        assertThat(unreadCount).isEqualTo(2);
    }

    @Test
    void findByIdAndUser_returnsNotificationOnlyForOwner() {
        User owner = saveUser("n4");
        User stranger = saveUser("n5");

        Notification saved = notificationRepository.saveAndFlush(notification(owner, NotificationType.WELCOME, false));

        Optional<Notification> forOwner = notificationRepository.findByIdAndUser(saved.getId(), owner);
        Optional<Notification> forStranger = notificationRepository.findByIdAndUser(saved.getId(), stranger);

        assertThat(forOwner).isPresent();
        assertThat(forStranger).isEmpty();
    }

    @Test
    void findByUserOrderByCreatedAtDesc_returnsOnlyUserNotifications() {
        User user = saveUser("n6");
        User otherUser = saveUser("n7");

        notificationRepository.saveAllAndFlush(List.of(
            notification(user, NotificationType.WELCOME, false),
            notification(user, NotificationType.FIRST_CV_CREATED, false),
            notification(otherUser, NotificationType.WELCOME, false)
        ));

        List<Notification> result = notificationRepository.findByUserOrderByCreatedAtDesc(user);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(notification -> "n6".equals(notification.getUser().getId()));
    }

    private User saveUser(String id) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        user.setFullName("User " + id);
        user.setPublic(false);
        return userRepository.saveAndFlush(user);
    }

    private Notification notification(User user, NotificationType type, boolean isRead) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle("Title " + type);
        notification.setMessage("Message " + type);
        notification.setRead(isRead);
        if (isRead) {
            notification.setReadAt(LocalDateTime.now().minusHours(1));
        }
        return notification;
    }
}
