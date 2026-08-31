package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.AssessmentAttempt;
import com.olms.olms_backend.service.AssessmentAttemptService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/assessment-attempts")
public class AssessmentAttemptController {

    private final AssessmentAttemptService attemptService;

    public AssessmentAttemptController(
            AssessmentAttemptService attemptService) {

        this.attemptService = attemptService;
    }

    @PostMapping
    public ResponseEntity<AssessmentAttempt> createAttempt(
            @RequestBody AssessmentAttempt attempt) {

        AssessmentAttempt created =
                attemptService.createAttempt(attempt);

        return new ResponseEntity<>(
                created,
                HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AssessmentAttempt>>
    getAllAttempts() {

        List<AssessmentAttempt> attempts =
                attemptService.getAllAttempts();

        if (attempts.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                attempts,
                HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessmentAttempt>
    getAttemptById(@PathVariable Long id) {

        Optional<AssessmentAttempt> attempt =
                attemptService.getAttemptById(id);

        if (attempt.isPresent()) {
            return new ResponseEntity<>(
                    attempt.get(),
                    HttpStatus.OK);
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND);
    }

    @GetMapping("/assessment/{assessmentId}")
    public ResponseEntity<List<AssessmentAttempt>>
    getAttemptsByAssessmentId(
            @PathVariable Long assessmentId) {

        List<AssessmentAttempt> attempts =
                attemptService
                        .getAttemptsByAssessmentId(
                                assessmentId);

        if (attempts.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                attempts,
                HttpStatus.OK);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AssessmentAttempt>>
    getAttemptsByUserId(
            @PathVariable Long userId) {

        List<AssessmentAttempt> attempts =
                attemptService
                        .getAttemptsByUserId(userId);

        if (attempts.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                attempts,
                HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssessmentAttempt>
    updateAttempt(
            @PathVariable Long id,
            @RequestBody AssessmentAttempt attempt) {

        AssessmentAttempt updated =
                attemptService.updateAttempt(
                        id,
                        attempt);

        if (updated != null) {
            return new ResponseEntity<>(
                    updated,
                    HttpStatus.OK);
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttempt(
            @PathVariable Long id) {

        Optional<AssessmentAttempt> attempt =
                attemptService.getAttemptById(id);

        if (attempt.isPresent()) {

            attemptService.deleteAttempt(id);

            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND);
    }
}