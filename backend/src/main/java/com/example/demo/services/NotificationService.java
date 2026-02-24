package com.example.demo.services;

import com.example.demo.enums.NotificationType;
import com.example.demo.models.Notification;
import com.example.demo.models.User;
import com.example.demo.repositories.NotificationRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<Notification> getNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public Notification markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
        }

        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);

        notifications.stream()
            .filter(notification -> !notification.isRead())
            .forEach(notification -> {
                notification.setRead(true);
                notification.setReadAt(LocalDateTime.now());
            });

        notificationRepository.saveAll(notifications);
    }

    public void create(User user, NotificationType type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    public void createOnce(User user, NotificationType type, String title, String message) {
        boolean exists = notificationRepository.existsByUserIdAndType(user.getId(), type);
        if (exists) {
            return;
        }

        create(user, type, title, message);
    }

    public void createOnceByUserId(String userId, NotificationType type, String title, String message) {
        userRepository.findById(userId).ifPresent(user -> createOnce(user, type, title, message));
    }
}
