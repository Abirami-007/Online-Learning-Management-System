package com.olms.olms_backend.service;

import com.olms.olms_backend.dto.CourseProgressDto;
import com.olms.olms_backend.entity.LessonProgress;

import java.util.List;
import java.util.Set;

public interface LessonProgressService {

    LessonProgress createProgress(LessonProgress progress);

    List<LessonProgress> getAllProgress();

    LessonProgress getProgressById(Long id);

    LessonProgress updateProgress(Long id, LessonProgress progress);

    void deleteProgress(Long id);

    // ── Progression and Gating Rules ──

    /** Returns true if the module is unlocked for this user. */
    boolean isModuleUnlocked(Long userId, Long moduleId);

    /** Returns true if all required lessons in the module are completed AND its assessment(s) are passed. */
    boolean isModuleComplete(Long userId, Long moduleId);

    /** Returns true if the lesson is unlocked for this user. */
    boolean isLessonUnlocked(Long userId, Long lessonId);

    /** Returns true if the assessment is unlocked for this user. */
    boolean isAssessmentUnlocked(Long userId, Long assessmentId);

    /** Helper to check if a user is instructor of the course or an admin. */
    boolean isInstructorOwnerOrAdmin(com.olms.olms_backend.entity.User user, com.olms.olms_backend.entity.Course course);

    /** Marks a lesson complete after validating prerequisites. Throws ContentAccessDeniedException if locked. */
    LessonProgress completeLesson(Long userId, Long lessonId);

    /** Builds the full progress tree (with lock flags) for a course — single API call for the frontend. */
    CourseProgressDto getCourseProgress(Long userId, Long courseId);

    /** Returns the set of completed lesson IDs for a user in a course. */
    Set<Long> getCompletedLessonIds(Long userId, Long courseId);
}