package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.Course;
import com.olms.olms_backend.entity.Lesson;
import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.repository.CourseRepository;
import com.olms.olms_backend.repository.EnrollmentRepository;
import com.olms.olms_backend.repository.UserRepository;
import com.olms.olms_backend.service.LessonProgressService;
import com.olms.olms_backend.service.LessonService;
import com.olms.olms_backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;
    private final LessonProgressService lessonProgressService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public LessonController(
            LessonService lessonService,
            LessonProgressService lessonProgressService,
            JwtUtil jwtUtil,
            UserRepository userRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository) {
        this.lessonService = lessonService;
        this.lessonProgressService = lessonProgressService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @PostMapping
    public ResponseEntity<Lesson> createLesson(
            @RequestBody Lesson lesson) {

        Lesson createdLesson = lessonService.createLesson(lesson);
        return new ResponseEntity<>(createdLesson, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Lesson>> getAllLessons() {

        List<Lesson> lessons = lessonService.getAllLessons();
        if (lessons.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(lessons, HttpStatus.OK);
    }

    /**
     * GET /api/lessons/{id}
     * Returns lesson metadata for all authenticated users.
     * For learners: content fields (videoUrl, content) are stripped when the lesson is locked.
     * For instructors of the course: all fields returned regardless of lock state.
     *
     * RULE 2 + RULE 3: locked lessons show title/metadata but not learning material.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getLessonById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(name = "userId", required = false) Long userIdParam) {

        Optional<Lesson> lessonOpt = lessonService.getLessonById(id);
        if (lessonOpt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Lesson lesson = lessonOpt.get();
        User callingUser = resolveUser(authHeader, userIdParam);

        // Unauthenticated callers only see safe metadata (no video URL, no content)
        if (callingUser == null) {
            return ResponseEntity.ok(buildLockedView(lesson));
        }

        // Instructors/Admins bypass lock — they see full lesson content
        if (lessonProgressService.isInstructorOwnerOrAdmin(callingUser, lesson.getModule().getCourse())) {
            return new ResponseEntity<>(lesson, HttpStatus.OK);
        }

        // For learners, check if this lesson is unlocked (checks enrollment & prerequisites)
        boolean unlocked = lessonProgressService.isLessonUnlocked(callingUser.getId(), id);
        if (!unlocked) {
            // Return safe metadata only — no video URL, no content (Rule 5)
            return ResponseEntity.ok(buildLockedView(lesson));
        }

        return new ResponseEntity<>(lesson, HttpStatus.OK);
    }

    /**
     * GET /api/lessons/{id}/content
     * Strict content endpoint — returns 403 if learner is not enrolled or if lesson is locked.
     * Instructors of the course get full access.
     *
     * RULE 5 & 6 & 7: Backend must reject locked lesson content requests.
     */
    @GetMapping("/{id}/content")
    public ResponseEntity<?> getLessonContent(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(name = "userId", required = false) Long userIdParam) {

        Optional<Lesson> lessonOpt = lessonService.getLessonById(id);
        if (lessonOpt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Lesson lesson = lessonOpt.get();
        User callingUser = resolveUser(authHeader, userIdParam);

        if (callingUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required to access lesson content."));
        }

        // Instructors/Admins bypass lock — Rule 6
        if (lessonProgressService.isInstructorOwnerOrAdmin(callingUser, lesson.getModule().getCourse())) {
            return new ResponseEntity<>(lesson, HttpStatus.OK);
        }

        // Learner: verify enrollment first
        Long courseId = lesson.getModule().getCourse().getId();
        boolean enrolled = enrollmentRepository.existsByUserIdAndCourseId(callingUser.getId(), courseId);
        if (!enrolled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "You must be enrolled in this course to access lesson content.",
                            "locked", true,
                            "enrolled", false,
                            "lessonId", id
                    ));
        }

        // Learner: enforce progression lock
        boolean unlocked = lessonProgressService.isLessonUnlocked(callingUser.getId(), id);
        if (!unlocked) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "This lesson is locked. Complete the previous required lessons and assessments to unlock it.",
                            "locked", true,
                            "lessonId", id,
                            "lessonTitle", lesson.getTitle()
                    ));
        }

        return new ResponseEntity<>(lesson, HttpStatus.OK);
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<?> getLessonsByModuleId(
            @PathVariable Long moduleId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(name = "userId", required = false) Long userIdParam) {

        List<Lesson> lessons = lessonService.getLessonsByModuleId(moduleId);
        if (lessons.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        User callingUser = resolveUser(authHeader, userIdParam);
        if (callingUser == null) {
            // Unauthenticated callers receive safe metadata only
            java.util.List<Object> safeLessons = new java.util.ArrayList<>();
            for (Lesson l : lessons) {
                safeLessons.add(buildLockedView(l));
            }
            return ResponseEntity.ok(safeLessons);
        }

        boolean isBypass = callingUser.getRole() != null &&
                (callingUser.getRole().toUpperCase().contains("INSTRUCTOR") || callingUser.getRole().toUpperCase().contains("ADMIN"));
        if (!isBypass) {
            java.util.List<Object> safeLessons = new java.util.ArrayList<>();
            for (Lesson l : lessons) {
                boolean unlocked = lessonProgressService.isLessonUnlocked(callingUser.getId(), l.getId());
                if (unlocked) {
                    safeLessons.add(l);
                } else {
                    safeLessons.add(buildLockedView(l));
                }
            }
            return ResponseEntity.ok(safeLessons);
        }

        return new ResponseEntity<>(lessons, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lesson> updateLesson(
            @PathVariable Long id,
            @RequestBody Lesson lesson) {

        Lesson updatedLesson = lessonService.updateLesson(id, lesson);
        if (updatedLesson != null) {
            return new ResponseEntity<>(updatedLesson, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(
            @PathVariable Long id) {

        Optional<Lesson> lesson = lessonService.getLessonById(id);
        if (lesson.isPresent()) {
            lessonService.deleteLesson(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** Build a safe lesson view for locked lessons: shows title/metadata but hides learning content. */
    private Map<String, Object> buildLockedView(Lesson lesson) {
        return Map.of(
                "id", lesson.getId(),
                "title", lesson.getTitle(),
                "lessonOrder", lesson.getLessonOrder(),
                "locked", true,
                "unlockMessage", "Complete the previous required lessons to unlock this lesson.",
                "videoUrl", "",
                "video_url", "",
                "content", "",
                "description", lesson.getDescription() != null ? lesson.getDescription() : ""
        );
    }

    /** Extract the User from the Bearer JWT token or userId parameter. */
    private User resolveUser(String authHeader, Long userIdParam) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String email = jwtUtil.extractEmail(token);
                Optional<User> u = userRepository.findByEmail(email);
                if (u.isPresent()) {
                    return u.get();
                }
            } catch (Exception ignored) {
            }
        }
        if (userIdParam != null) {
            return userRepository.findById(userIdParam).orElse(null);
        }
        return null;
    }
}