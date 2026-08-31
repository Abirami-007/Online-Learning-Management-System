package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Notification;

import java.util.List;

public interface NotificationService {

    Notification createNotification(Notification notification);

    List<Notification> getAllNotifications();

    Notification getNotificationById(Long id);

    Notification updateNotification(Long id, Notification notification);

    void deleteNotification(Long id);
}