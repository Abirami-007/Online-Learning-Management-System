package com.olms.olms_backend.service.impl;

import com.olms.olms_backend.service.*;
import com.olms.olms_backend.entity.Notification;
import com.olms.olms_backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository repository;
    public NotificationServiceImpl(NotificationRepository repository) {
        this.repository = repository;
    }
    @Override
    public Notification createNotification(Notification notification) {
        return repository.save(notification);
    }
    @Override
    public List<Notification> getAllNotifications() {
        return repository.findAll();
    }

    @Override
    public Notification getNotificationById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found with id: " + id
                        ));
    }
    @Override
    public Notification updateNotification(
            Long id,
            Notification notification) {

        Notification existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found with id: " + id
                        ));
        existing.setTitle(notification.getTitle());
        existing.setMessage(notification.getMessage());
        existing.setRead(notification.isRead());
        existing.setUser(notification.getUser());

        return repository.save(existing);
    }
    @Override
    public void deleteNotification(Long id) {
        Notification existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found with id: " + id
                        ));

        repository.delete(existing);
    }
}
