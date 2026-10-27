package com.olms.olms_backend.service.impl;

import com.olms.olms_backend.service.*;

import com.olms.olms_backend.entity.Assessment;
import com.olms.olms_backend.entity.AssessmentAttempt;
import com.olms.olms_backend.entity.Certificate;
import com.olms.olms_backend.entity.Course;
import com.olms.olms_backend.entity.Lesson;
import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.exception.ContentAccessDeniedException;
import com.olms.olms_backend.repository.AssessmentAttemptRepository;
import com.olms.olms_backend.repository.AssessmentRepository;
import com.olms.olms_backend.repository.CertificateRepository;
import com.olms.olms_backend.repository.LessonProgressRepository;
import com.olms.olms_backend.repository.LessonRepository;
import com.olms.olms_backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AssessmentAttemptServiceImpl
        implements AssessmentAttemptService {

    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentRepository assessmentRepository;
    private final UserRepository userRepository;
    private final CertificateRepository certificateRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonProgressService lessonProgressService;
    private final com.olms.olms_backend.repository.EnrollmentRepository enrollmentRepository;

    public AssessmentAttemptServiceImpl(
            AssessmentAttemptRepository attemptRepository,
            AssessmentRepository assessmentRepository,
            UserRepository userRepository,
            CertificateRepository certificateRepository,
            LessonRepository lessonRepository,
            LessonProgressRepository lessonProgressRepository,
            LessonProgressService lessonProgressService,
            com.olms.olms_backend.repository.EnrollmentRepository enrollmentRepository) {

        this.attemptRepository = attemptRepository;
        this.assessmentRepository = assessmentRepository;
        this.userRepository = userRepository;
        this.certificateRepository = certificateRepository;
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.lessonProgressService = lessonProgressService;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Override
    public AssessmentAttempt createAttempt(
            AssessmentAttempt attempt) {

        if (attempt.getAssessment() == null ||
                attempt.getAssessment().getId() == null) {

            throw new RuntimeException(
                    "Assessment ID is required");
        }

        if (attempt.getUser() == null ||
                attempt.getUser().getId() == null) {

            throw new RuntimeException(
                    "User ID is required");
        }

        Long assessmentId =
                attempt.getAssessment().getId();

        Long userId =
                attempt.getUser().getId();

        Assessment assessment =
                assessmentRepository.findById(assessmentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Assessment not found with id: "
                                                + assessmentId));

        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found with id: "
                                                + userId));

        attempt.setAssessment(assessment);
        attempt.setUser(user);

        // ── ENROLLMENT & LOCK GUARD ──
        Course course = (assessment.getModule() != null) ? assessment.getModule().getCourse() : null;
        boolean isBypassRole = lessonProgressService.isInstructorOwnerOrAdmin(user, course);

        if (!isBypassRole) {
            if (course != null && !enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
                throw new ContentAccessDeniedException(
                        "Enrollment required: You must be enrolled in this course to take this assessment.");
            }
            if (!lessonProgressService.isAssessmentUnlocked(userId, assessmentId)) {
                throw new ContentAccessDeniedException(
                        "Cannot attempt assessment: all required lessons in module '"
                        + (assessment.getModule() != null ? assessment.getModule().getTitle() : "")
                        + "' must be completed first.");
            }
        }

        AssessmentAttempt savedAttempt = attemptRepository.save(attempt);

        // Auto-generate certificate if attempt is passed
        if (Boolean.TRUE.equals(savedAttempt.getPassed())) {
            if (course != null) {
                boolean exists = certificateRepository.existsByUserIdAndCourseId(user.getId(), course.getId());
                if (!exists) {
                    Certificate cert = new Certificate(
                            course.getTitle() + " Certificate of Completion",
                            "/certificates",
                            LocalDate.now().toString(),
                            user,
                            course
                    );
                    certificateRepository.save(cert);
                }
            }
        }

        return savedAttempt;
    }

    @Override
    public List<AssessmentAttempt> getAllAttempts() {
        return attemptRepository.findAll();
    }

    @Override
    public Optional<AssessmentAttempt> getAttemptById(
            Long id) {

        return attemptRepository.findById(id);
    }

    @Override
    public List<AssessmentAttempt> getAttemptsByAssessmentId(
            Long assessmentId) {

        return attemptRepository
                .findByAssessmentId(assessmentId);
    }

    @Override
    public List<AssessmentAttempt> getAttemptsByUserId(
            Long userId) {

        return attemptRepository
                .findByUserId(userId);
    }

    @Override
    public AssessmentAttempt updateAttempt(
            Long id,
            AssessmentAttempt attempt) {

        Optional<AssessmentAttempt> existingAttempt =
                attemptRepository.findById(id);

        if (existingAttempt.isEmpty()) {
            return null;
        }

        AssessmentAttempt existing =
                existingAttempt.get();

        existing.setScore(attempt.getScore());
        existing.setPassed(attempt.getPassed());

        if (attempt.getAssessment() != null &&
                attempt.getAssessment().getId() != null) {

            Long assessmentId =
                    attempt.getAssessment().getId();

            Assessment assessment =
                    assessmentRepository.findById(assessmentId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Assessment not found with id: "
                                                    + assessmentId));

            existing.setAssessment(assessment);
        }

        if (attempt.getUser() != null &&
                attempt.getUser().getId() != null) {

            Long userId =
                    attempt.getUser().getId();

            User user =
                    userRepository.findById(userId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "User not found with id: "
                                                    + userId));

            existing.setUser(user);
        }

        return attemptRepository.save(existing);
    }

    @Override
    public void deleteAttempt(Long id) {
        attemptRepository.deleteById(id);
    }
}
