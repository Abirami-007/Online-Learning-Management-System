package com.olms.olms_backend.repository;

import com.olms.olms_backend.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonProgressRepository
        extends JpaRepository<LessonProgress, Long> {

    List<LessonProgress> findByUserId(Long userId);

    List<LessonProgress> findByLessonId(Long lessonId);
}