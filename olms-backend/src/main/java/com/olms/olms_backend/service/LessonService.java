package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Lesson;

import java.util.List;
import java.util.Optional;

public interface LessonService {

    // Create lesson
    Lesson createLesson(Lesson lesson);

    // Get all lessons
    List<Lesson> getAllLessons();

    // Get lesson by ID
    Optional<Lesson> getLessonById(Long id);

    // Get lessons by module ID
    List<Lesson> getLessonsByModuleId(Long moduleId);

    // Update lesson
    Lesson updateLesson(Long id, Lesson lesson);

    // Delete lesson
    void deleteLesson(Long id);
}