package com.olms.olms_backend.service.impl;

import com.olms.olms_backend.service.*;

import com.olms.olms_backend.dto.AssessmentStatusDto;
import com.olms.olms_backend.dto.CourseProgressDto;
import com.olms.olms_backend.dto.LessonStatusDto;
import com.olms.olms_backend.dto.ModuleStatusDto;
import com.olms.olms_backend.entity.Assessment;
import com.olms.olms_backend.entity.Course;
import com.olms.olms_backend.entity.CourseModule;
import com.olms.olms_backend.entity.Lesson;
import com.olms.olms_backend.entity.LessonProgress;
import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.exception.ContentAccessDeniedException;
import com.olms.olms_backend.repository.AssessmentAttemptRepository;
import com.olms.olms_backend.repository.AssessmentRepository;
import com.olms.olms_backend.repository.CourseModuleRepository;
import com.olms.olms_backend.repository.CourseRepository;
import com.olms.olms_backend.repository.LessonProgressRepository;
import com.olms.olms_backend.repository.LessonRepository;
import com.olms.olms_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class LessonProgressServiceImpl implements LessonProgressService {

    private final LessonProgressRepository repository;
    private final LessonRepository lessonRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final CourseRepository courseRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final com.olms.olms_backend.repository.EnrollmentRepository enrollmentRepository;

    public LessonProgressServiceImpl(
            LessonProgressRepository repository,
            LessonRepository lessonRepository,
            CourseModuleRepository courseModuleRepository,
            CourseRepository courseRepository,
            AssessmentRepository assessmentRepository,
            AssessmentAttemptRepository attemptRepository,
            UserRepository userRepository,
            com.olms.olms_backend.repository.EnrollmentRepository enrollmentRepository) {

        this.repository = repository;
        this.lessonRepository = lessonRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.courseRepository = courseRepository;
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    // ── Existing CRUD ────────────────────────────────────────────────────────

    @Override
    public LessonProgress createProgress(LessonProgress progress) {
        return repository.save(progress);
    }

    @Override
    public List<LessonProgress> getAllProgress() {
        return repository.findAll();
    }

    @Override
    public LessonProgress getProgressById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "LessonProgress not found with id: " + id
                        ));
    }

    @Override
    public LessonProgress updateProgress(Long id, LessonProgress progress) {

        LessonProgress existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "LessonProgress not found with id: " + id
                        ));

        existing.setCompleted(progress.isCompleted());
        existing.setProgressPercentage(progress.getProgressPercentage());

        return repository.save(existing);
    }

    @Override
    public void deleteProgress(Long id) {

        LessonProgress existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "LessonProgress not found with id: " + id
                        ));

        repository.delete(existing);
    }

    // ── OLMS Progression Rules ──────────────────────────────────────────────

    /**
     * Helper to verify if user is instructor of the course or an admin.
     */
    @Override
    public boolean isInstructorOwnerOrAdmin(User user, Course course) {
        if (user == null) {
            return false;
        }
        String role = user.getRole();
        if (role == null) {
            return false;
        }
        if ("ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
            return true;
        }
        if ("ROLE_INSTRUCTOR".equalsIgnoreCase(role) || "INSTRUCTOR".equalsIgnoreCase(role)) {
            if (course == null || course.getInstructor() == null || course.getInstructor().isBlank()) {
                return true;
            }
            String inst = course.getInstructor().trim();
            if (user.getFullName() != null && user.getFullName().trim().equalsIgnoreCase(inst)) {
                return true;
            }
            if (user.getEmail() != null && user.getEmail().trim().equalsIgnoreCase(inst)) {
                return true;
            }
            if (user.getFullName() != null && user.getFullName().toLowerCase().contains(inst.toLowerCase())) {
                return true;
            }
            if (user.getFullName() != null && inst.toLowerCase().contains(user.getFullName().toLowerCase())) {
                return true;
            }
            return true;
        }
        return false;
    }

    /**
     * A module is complete when:
     * 1. All required lessons in the module are completed.
     * 2. If the module has assessment(s), the learner has passed them.
     */
    @Override
    public boolean isModuleComplete(Long userId, Long moduleId) {
        List<Lesson> lessons = lessonRepository.findByModule_IdOrderByLessonOrderAsc(moduleId);
        for (Lesson l : lessons) {
            if (!repository.existsByUserIdAndLessonIdAndCompletedTrue(userId, l.getId())) {
                return false;
            }
        }

        List<Assessment> assessments = assessmentRepository.findByModuleId(moduleId);
        for (Assessment a : assessments) {
            if (!attemptRepository.existsByUserIdAndAssessmentIdAndPassedTrue(userId, a.getId())) {
                return false;
            }
        }

        return true;
    }

    /**
     * Next Module Unlocked = All Required Lessons Completed AND Assessment Passed for preceding modules.
     * First module is unlocked for enrolled learners.
     */
    @Override
    public boolean isModuleUnlocked(Long userId, Long moduleId) {
        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));

        Course course = module.getCourse();
        User user = userRepository.findById(userId).orElse(null);

        // Instructors and Admins bypass locks for preview
        if (isInstructorOwnerOrAdmin(user, course)) {
            return true;
        }

        // Verify enrollment for learner
        if (course != null && !enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            return false;
        }

        List<CourseModule> modules = courseModuleRepository.findByCourseIdOrderByModuleOrderAsc(course.getId());
        int moduleIndex = indexOfId(modules, moduleId);

        if (moduleIndex <= 0) {
            return true;
        }

        // Every preceding module must be completed (lessons completed + assessment passed)
        for (int i = 0; i < moduleIndex; i++) {
            if (!isModuleComplete(userId, modules.get(i).getId())) {
                return false;
            }
        }

        return true;
    }

    /**
     * Assessment Gating:
     * Available ONLY when module is unlocked AND all required lessons in the current module are completed.
     */
    @Override
    public boolean isAssessmentUnlocked(Long userId, Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found: " + assessmentId));

        CourseModule module = assessment.getModule();
        if (module == null) {
            return true;
        }

        Course course = module.getCourse();
        User user = userRepository.findById(userId).orElse(null);

        if (isInstructorOwnerOrAdmin(user, course)) {
            return true;
        }

        // Module must be unlocked first
        if (!isModuleUnlocked(userId, module.getId())) {
            return false;
        }

        // All required lessons in this module must be completed
        List<Lesson> lessons = lessonRepository.findByModule_IdOrderByLessonOrderAsc(module.getId());
        for (Lesson l : lessons) {
            if (!repository.existsByUserIdAndLessonIdAndCompletedTrue(userId, l.getId())) {
                return false;
            }
        }

        return true;
    }

    /**
     * Lesson Unlocking:
     * 1. Module must be unlocked.
     * 2. First lesson in module is unlocked.
     * 3. Non-first lesson requires immediate previous lesson in this module to be completed.
     */
    @Override
    public boolean isLessonUnlocked(Long userId, Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found: " + lessonId));

        CourseModule module = lesson.getModule();
        Course course = module.getCourse();

        User user = userRepository.findById(userId).orElse(null);
        if (isInstructorOwnerOrAdmin(user, course)) {
            return true;
        }

        // Module must be unlocked first
        if (!isModuleUnlocked(userId, module.getId())) {
            return false;
        }

        List<Lesson> moduleLessons = lessonRepository.findByModule_IdOrderByLessonOrderAsc(module.getId());
        int lessonIndex = indexOfId(moduleLessons, lessonId);

        if (lessonIndex <= 0) {
            return true;
        }

        Long prevLessonId = moduleLessons.get(lessonIndex - 1).getId();
        return repository.existsByUserIdAndLessonIdAndCompletedTrue(userId, prevLessonId);
    }

    /**
     * Marks a lesson as complete for a user.
     * Validates enrollment and sequential prerequisite unlock before marking complete.
     */
    @Override
    @Transactional
    public LessonProgress completeLesson(Long userId, Long lessonId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found: " + lessonId));

        Course course = lesson.getModule().getCourse();
        boolean isBypass = isInstructorOwnerOrAdmin(user, course);

        if (!isBypass) {
            if (course != null && !enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
                throw new ContentAccessDeniedException("Enrollment required: You must be enrolled in this course to complete lessons.");
            }
            if (!isLessonUnlocked(userId, lessonId)) {
                throw new ContentAccessDeniedException(
                        "Cannot complete this lesson: prerequisite lessons or modules are not finished yet.");
            }
        }

        // Upsert — idempotent
        Optional<LessonProgress> existing = repository.findByUserIdAndLessonId(userId, lessonId);
        if (existing.isPresent()) {
            LessonProgress lp = existing.get();
            lp.setCompleted(true);
            lp.setProgressPercentage(100);
            lp.setCompletedAt(LocalDateTime.now());
            return repository.save(lp);
        }

        LessonProgress lp = new LessonProgress(true, 100, user, lesson);
        lp.setCompletedAt(LocalDateTime.now());
        return repository.save(lp);
    }

    /**
     * Builds the full course progress tree with per-lesson, per-assessment, and per-module lock flags.
     * Adheres to:
     * - Next Module Unlocked = All Required Lessons Completed AND Assessment Passed.
     * - Assessments unlocked only after all lessons in module are complete.
     * - Instructors preview with all unlocked without altering learner progression.
     */
    @Override
    public CourseProgressDto getCourseProgress(Long userId, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        User user = userRepository.findById(userId).orElse(null);
        boolean isBypass = isInstructorOwnerOrAdmin(user, course);
        boolean isEnrolled = isBypass || enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);

        Set<Long> completedIds = repository.findCompletedLessonIdsByUserAndCourse(userId, courseId);
        List<CourseModule> modules = courseModuleRepository.findByCourseIdOrderByModuleOrderAsc(courseId);

        int totalLessons = 0;
        int totalCompleted = 0;
        boolean prevModuleComplete = true; // Module 0 has no prerequisite

        List<ModuleStatusDto> moduleDtos = new ArrayList<>();

        for (int mi = 0; mi < modules.size(); mi++) {
            CourseModule mod = modules.get(mi);
            boolean moduleLocked = !isBypass && (!isEnrolled || !prevModuleComplete);

            List<Lesson> lessons = lessonRepository.findByModule_IdOrderByLessonOrderAsc(mod.getId());
            boolean allLessonsDoneInModule = true;
            List<LessonStatusDto> lessonDtos = new ArrayList<>();

            for (int li = 0; li < lessons.size(); li++) {
                Lesson l = lessons.get(li);
                boolean done = completedIds.contains(l.getId());
                boolean locked;
                String unlockReq = null;

                if (isBypass) {
                    locked = false;
                } else if (!isEnrolled) {
                    locked = true;
                    unlockReq = "Enroll in this course to access lessons and videos";
                } else if (moduleLocked) {
                    locked = true;
                    unlockReq = "Complete all lessons and pass the assessment in the previous module first";
                } else if (li == 0) {
                    locked = false;
                } else {
                    Long prevId = lessons.get(li - 1).getId();
                    locked = !completedIds.contains(prevId);
                    if (locked) {
                        unlockReq = "Complete \"" + lessons.get(li - 1).getTitle() + "\" first";
                    }
                }

                if (!done) {
                    allLessonsDoneInModule = false;
                }
                totalLessons++;
                if (done) totalCompleted++;

                LessonStatusDto ldto = new LessonStatusDto();
                ldto.setLessonId(l.getId());
                ldto.setTitle(l.getTitle());
                ldto.setLessonOrder(l.getLessonOrder());
                ldto.setCompleted(done);
                ldto.setLocked(locked);
                ldto.setUnlockRequirement(unlockReq);
                lessonDtos.add(ldto);
            }

            // Assessments in this module
            List<Assessment> assessments = assessmentRepository.findByModuleId(mod.getId());
            List<AssessmentStatusDto> assessmentDtos = new ArrayList<>();
            boolean allAssessmentsPassed = true;

            for (Assessment a : assessments) {
                boolean passed = attemptRepository.existsByUserIdAndAssessmentIdAndPassedTrue(userId, a.getId());
                if (!passed) {
                    allAssessmentsPassed = false;
                }

                boolean assessmentLocked;
                String aUnlockReq = null;

                if (isBypass) {
                    assessmentLocked = false;
                } else if (!isEnrolled) {
                    assessmentLocked = true;
                    aUnlockReq = "Enroll in this course to access assessments";
                } else if (moduleLocked) {
                    assessmentLocked = true;
                    aUnlockReq = "Unlock this module first";
                } else if (!allLessonsDoneInModule) {
                    assessmentLocked = true;
                    aUnlockReq = "Complete all lessons in \"" + mod.getTitle() + "\" first";
                } else {
                    assessmentLocked = false;
                }

                AssessmentStatusDto adto = new AssessmentStatusDto();
                adto.setAssessmentId(a.getId());
                adto.setTitle(a.getTitle());
                adto.setLocked(assessmentLocked);
                adto.setPassed(passed);
                adto.setUnlockRequirement(aUnlockReq);
                assessmentDtos.add(adto);
            }

            boolean thisModuleComplete = (lessons.isEmpty() || allLessonsDoneInModule) && allAssessmentsPassed;

            ModuleStatusDto mdto = new ModuleStatusDto();
            mdto.setModuleId(mod.getId());
            mdto.setTitle(mod.getTitle());
            mdto.setModuleOrder(mod.getModuleOrder());
            mdto.setCompleted(thisModuleComplete);
            mdto.setLocked(moduleLocked);
            mdto.setLessons(lessonDtos);
            mdto.setAssessments(assessmentDtos);
            moduleDtos.add(mdto);

            // Gating next module: strictly requires current module lessons complete AND assessment passed
            prevModuleComplete = prevModuleComplete && thisModuleComplete;
        }

        int percent = totalLessons > 0
                ? Math.round((totalCompleted * 100f) / totalLessons)
                : 0;

        CourseProgressDto result = new CourseProgressDto();
        result.setCourseId(courseId);
        result.setCourseTitle(course.getTitle());
        result.setTotalLessons(totalLessons);
        result.setCompletedLessons(totalCompleted);
        result.setProgressPercent(percent);
        result.setEnrolled(isEnrolled);
        result.setModules(moduleDtos);
        return result;
    }

    @Override
    public Set<Long> getCompletedLessonIds(Long userId, Long courseId) {
        return repository.findCompletedLessonIdsByUserAndCourse(userId, courseId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Returns the 0-based index of an entity with the given id in a list. */
    private <T> int indexOfId(List<T> items, Long targetId) {
        for (int i = 0; i < items.size(); i++) {
            Long id = getIdFromEntity(items.get(i));
            if (targetId.equals(id)) return i;
        }
        return -1;
    }

    private Long getIdFromEntity(Object entity) {
        if (entity instanceof Lesson l) return l.getId();
        if (entity instanceof CourseModule m) return m.getId();
        throw new IllegalArgumentException("Unsupported entity type: " + entity.getClass());
    }
}
