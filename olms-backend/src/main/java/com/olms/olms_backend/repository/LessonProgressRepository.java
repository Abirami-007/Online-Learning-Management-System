package com.olms.olms_backend.repository;

import com.olms.olms_backend.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface LessonProgressRepository
        extends JpaRepository<LessonProgress, Long> {

    List<LessonProgress> findByUserId(Long userId);

    List<LessonProgress> findByLessonId(Long lessonId);

    Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);

    boolean existsByUserIdAndLessonIdAndCompletedTrue(Long userId, Long lessonId);

    List<LessonProgress> findByUserIdAndCompletedTrue(Long userId);

    @Query("SELECT lp.lesson.id FROM LessonProgress lp " +
           "WHERE lp.user.id = :userId AND lp.completed = true " +
           "AND lp.lesson.module.course.id = :courseId")
    Set<Long> findCompletedLessonIdsByUserAndCourse(
        @Param("userId") Long userId,
        @Param("courseId") Long courseId);
}