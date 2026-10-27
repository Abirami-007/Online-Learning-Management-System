package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.CourseModule;
import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.repository.EnrollmentRepository;
import com.olms.olms_backend.repository.UserRepository;
import com.olms.olms_backend.service.CourseModuleService;
import com.olms.olms_backend.service.LessonProgressService;
import com.olms.olms_backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/course-modules")
public class CourseModuleController {

    private final CourseModuleService courseModuleService;
    private final LessonProgressService lessonProgressService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public CourseModuleController(
            CourseModuleService courseModuleService,
            LessonProgressService lessonProgressService,
            JwtUtil jwtUtil,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository) {
        this.courseModuleService = courseModuleService;
        this.lessonProgressService = lessonProgressService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @PostMapping
    public ResponseEntity<CourseModule> createCourseModule(
            @RequestBody CourseModule courseModule) {

        CourseModule createdModule =
                courseModuleService.createCourseModule(courseModule);

        return new ResponseEntity<>(
                createdModule,
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<CourseModule>> getAllCourseModules() {

        List<CourseModule> modules =
                courseModuleService.getAllCourseModules();

        if (modules.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                modules,
                HttpStatus.OK
        );
    }

    /**
     * GET /api/course-modules/{id}
     * Enforces module locking:
     * - Instructors/Admins bypass locks for preview.
     * - Learners are rejected with 403 Forbidden if previous module is not completed or assessment not passed.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseModuleById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(name = "userId", required = false) Long userIdParam) {

        Optional<CourseModule> moduleOpt =
                courseModuleService.getCourseModuleById(id);

        if (moduleOpt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        CourseModule module = moduleOpt.get();
        User callingUser = resolveUser(authHeader, userIdParam);

        if (callingUser != null) {
            boolean isBypass = lessonProgressService.isInstructorOwnerOrAdmin(callingUser, module.getCourse());
            if (!isBypass) {
                // Verify enrollment
                if (module.getCourse() != null && !enrollmentRepository.existsByUserIdAndCourseId(callingUser.getId(), module.getCourse().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Enrollment required: You are not enrolled in this course."));
                }

                // Verify module unlock
                boolean unlocked = lessonProgressService.isModuleUnlocked(callingUser.getId(), id);
                if (!unlocked) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of(
                                    "error", "Access denied: Module is locked. You must complete all required lessons and pass the assessment of previous modules.",
                                    "locked", true,
                                    "moduleId", id,
                                    "moduleTitle", module.getTitle()
                            ));
                }
            }
        } else {
            // Unauthenticated caller checking non-first module directly
            // First module may allow preview metadata, subsequent modules require auth
            List<CourseModule> courseMods = courseModuleService.getCourseModulesByCourseId(module.getCourse().getId());
            if (!courseMods.isEmpty() && !courseMods.get(0).getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: Module is locked. Authentication and progression required."));
            }
        }

        return new ResponseEntity<>(module, HttpStatus.OK);
    }

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

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseModule>> getCourseModulesByCourseId(
            @PathVariable Long courseId) {

        List<CourseModule> modules =
                courseModuleService.getCourseModulesByCourseId(courseId);

        if (modules.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                modules,
                HttpStatus.OK
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseModule> updateCourseModule(
            @PathVariable Long id,
            @RequestBody CourseModule courseModule) {

        CourseModule updatedModule =
                courseModuleService.updateCourseModule(
                        id,
                        courseModule
                );

        if (updatedModule != null) {
            return new ResponseEntity<>(
                    updatedModule,
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourseModule(
            @PathVariable Long id) {

        Optional<CourseModule> module =
                courseModuleService.getCourseModuleById(id);

        if (module.isPresent()) {

            courseModuleService.deleteCourseModule(id);

            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }
}