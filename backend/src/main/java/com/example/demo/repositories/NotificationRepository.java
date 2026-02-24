package com.example.demo.repositories;

import com.example.demo.enums.NotificationType;
import com.example.demo.models.Notification;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    Optional<Notification> findByIdAndUser(Long id, User user);

    boolean existsByUserIdAndType(String userId, NotificationType type);

    long countByUserIdAndIsReadFalse(String userId);
}
