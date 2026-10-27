package com.olms.olms_backend.controller;

import com.olms.olms_backend.dto.CourseProgressDto;
import com.olms.olms_backend.entity.LessonProgress;
import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.exception.ContentAccessDeniedException;
import com.olms.olms_backend.repository.UserRepository;
import com.olms.olms_backend.service.LessonProgressService;
import com.olms.olms_backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/lesson-progress")
public class LessonProgressController {

    private final LessonProgressService service;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public LessonProgressController(
            LessonProgressService service,
            JwtUtil jwtUtil,
            UserRepository userRepository) {
        this.service = service;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    // ── Existing CRUD ──────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<LessonProgress> createProgress(
            @RequestBody LessonProgress progress) {

        return new ResponseEntity<>(
                service.createProgress(progress),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<LessonProgress>> getAllProgress() {
        return ResponseEntity.ok(service.getAllProgress());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonProgress> getProgressById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getProgressById(id));
    }

    /**
     * PUT /api/lesson-progress/{id}
     * Guards against reverting a completed lesson to incomplete (Rule 1).
     * Learners cannot set completed=false once it is true.
     * Instructors/Admins are exempt from this guard.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProgress(
            @PathVariable Long id,
            @RequestBody LessonProgress progress,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User callingUser = resolveUser(authHeader, null);
        LessonProgress existing = service.getProgressById(id);
        boolean isBypassRole = callingUser != null && service.isInstructorOwnerOrAdmin(callingUser, existing.getLesson().getModule().getCourse());

        // RULE 1: Once completed, learners cannot revert to incomplete
        if (existing.isCompleted() && !progress.isCompleted() && !isBypassRole) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "A completed lesson cannot be marked as incomplete."));
        }

        return ResponseEntity.ok(service.updateProgress(id, progress));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProgress(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User callingUser = resolveUser(authHeader, null);
        LessonProgress existing = service.getProgressById(id);
        boolean isBypassRole = callingUser != null && service.isInstructorOwnerOrAdmin(callingUser, existing.getLesson().getModule().getCourse());

        if (existing.isCompleted() && !isBypassRole) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "A completed lesson cannot be deleted to reset progress."));
        }

        service.deleteProgress(id);
        return ResponseEntity.noContent().build();
    }

    // ── New Progression Endpoints ──────────────────────────────────────────────

    /**
     * POST /api/lesson-progress/complete
     * Accepts lessonId and userId via RequestBody OR QueryParams.
     * Resolves the calling user from the JWT header, falling back to userIdParam.
     * Validates prerequisites on the backend before marking complete.
     * Idempotent — safe to call twice.
     */
    @PostMapping("/complete")
    public ResponseEntity<?> completeLesson(
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(name = "lessonId", required = false) Long lessonIdParam,
            @RequestParam(name = "userId", required = false) Long userIdParam,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long lessonId = lessonIdParam;
        Long userId = userIdParam;

        if (body != null) {
            if (body.get("lessonId") != null) {
                try {
                    lessonId = Long.valueOf(body.get("lessonId").toString());
                } catch (NumberFormatException ignored) {}
            }
            if (body.get("userId") != null) {
                try {
                    userId = Long.valueOf(body.get("userId").toString());
                } catch (NumberFormatException ignored) {}
            }
        }

        if (lessonId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "lessonId is required"));
        }

        User callingUser = resolveUser(authHeader, userId);
        if (callingUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        try {
            LessonProgress lp = service.completeLesson(callingUser.getId(), lessonId);
            return ResponseEntity.ok(lp);
        } catch (ContentAccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/lesson-progress/course/{courseId}
     * GET /api/lesson-progress/course/{courseId}/progress
     * Returns the full module/lesson/assessment progress tree for the calling user.
     * Supports user resolution from JWT or userId query param.
     * Instructors see all lessons as unlocked (for preview).
     */
    @GetMapping({"/course/{courseId}", "/course/{courseId}/progress"})
    public ResponseEntity<?> getCourseProgress(
            @PathVariable Long courseId,
            @RequestParam(name = "userId", required = false) Long userIdParam,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User callingUser = resolveUser(authHeader, userIdParam);
        if (callingUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        CourseProgressDto dto = service.getCourseProgress(callingUser.getId(), courseId);
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/lesson-progress/check-unlock
     * Quick unlock check for a single lesson.
     */
    @GetMapping("/check-unlock")
    public ResponseEntity<?> checkLessonUnlock(
            @RequestParam Long lessonId,
            @RequestParam(name = "userId", required = false) Long userIdParam,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User callingUser = resolveUser(authHeader, userIdParam);
        if (callingUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        boolean unlocked = service.isLessonUnlocked(callingUser.getId(), lessonId);
        return ResponseEntity.ok(Map.of("unlocked", unlocked));
    }

    // ── Helper methods ─────────────────────────────────────────────────────────

    /** Extract the User from Bearer JWT token, falling back to userId if provided. */
    private User resolveUser(String authHeader, Long userId) {
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
        if (userId != null) {
            return userRepository.findById(userId).orElse(null);
        }
        return null;
    }

    private boolean isInstructorOrAdmin(User user) {
        String role = user.getRole();
        return "ROLE_INSTRUCTOR".equalsIgnoreCase(role)
                || "ROLE_ADMIN".equalsIgnoreCase(role)
                || "INSTRUCTOR".equalsIgnoreCase(role)
                || "ADMIN".equalsIgnoreCase(role);
    }
}