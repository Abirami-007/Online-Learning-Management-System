package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.Question;
import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.repository.UserRepository;
import com.olms.olms_backend.service.LessonProgressService;
import com.olms.olms_backend.service.QuestionService;
import com.olms.olms_backend.util.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;
    private final LessonProgressService lessonProgressService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public QuestionController(
            QuestionService questionService,
            LessonProgressService lessonProgressService,
            JwtUtil jwtUtil,
            UserRepository userRepository) {

        this.questionService = questionService;
        this.lessonProgressService = lessonProgressService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Question> createQuestion(
            @RequestBody Question question) {

        Question created =
                questionService.createQuestion(question);

        return new ResponseEntity<>(
                created,
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {

        List<Question> questions =
                questionService.getAllQuestions();

        if (questions.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                questions,
                HttpStatus.OK
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(
            @PathVariable Long id) {

        Optional<Question> question =
                questionService.getQuestionById(id);

        if (question.isPresent()) {
            return new ResponseEntity<>(
                    question.get(),
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    /**
     * GET /api/questions/assessment/{assessmentId}
     * Enforces assessment gating:
     * - Returns 403 Forbidden if the module is locked or all lessons are not completed.
     * - Instructors/Admins bypass for preview.
     */
    @GetMapping("/assessment/{assessmentId}")
    public ResponseEntity<?> getQuestionsByAssessmentId(
            @PathVariable Long assessmentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(name = "userId", required = false) Long userIdParam) {

        User callingUser = resolveUser(authHeader, userIdParam);
        if (callingUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required to access assessment questions."));
        }

        boolean unlocked = lessonProgressService.isAssessmentUnlocked(callingUser.getId(), assessmentId);
        if (!unlocked) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "Assessment is locked. Complete all required lessons in this module first.",
                            "locked", true,
                            "assessmentId", assessmentId
                    ));
        }

        List<Question> questions =
                questionService
                        .getQuestionsByAssessmentId(
                                assessmentId
                        );

        if (questions.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                questions,
                HttpStatus.OK
        );
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

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(
            @PathVariable Long id,
            @RequestBody Question question) {

        Question updated =
                questionService.updateQuestion(
                        id,
                        question
                );

        if (updated != null) {
            return new ResponseEntity<>(
                    updated,
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long id) {

        Optional<Question> question =
                questionService.getQuestionById(id);

        if (question.isPresent()) {

            questionService.deleteQuestion(id);

            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }
}