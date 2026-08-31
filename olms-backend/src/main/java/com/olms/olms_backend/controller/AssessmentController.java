package com.olms.olms_backend.controller;
import com.olms.olms_backend.entity.Assessment;
import com.olms.olms_backend.service.AssessmentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {
    private final AssessmentService assessmentService;
    public AssessmentController(
            AssessmentService assessmentService) {

        this.assessmentService = assessmentService;
    }
    @PostMapping
    public ResponseEntity<Assessment> createAssessment(
            @RequestBody Assessment assessment) {

        Assessment created =
                assessmentService.createAssessment(assessment);

        return new ResponseEntity<>(
                created,
                HttpStatus.CREATED
        );
    }
    @GetMapping
    public ResponseEntity<List<Assessment>> getAllAssessments() {

        List<Assessment> assessments =
                assessmentService.getAllAssessments();

        if (assessments.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                assessments,
                HttpStatus.OK
        );
    }
    @GetMapping("/{id}")
    public ResponseEntity<Assessment> getAssessmentById(
            @PathVariable Long id) {

        Optional<Assessment> assessment =
                assessmentService.getAssessmentById(id);

        if (assessment.isPresent()) {
            return new ResponseEntity<>(
                    assessment.get(),
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<Assessment>>
    getAssessmentsByModuleId(
            @PathVariable Long moduleId) {

        List<Assessment> assessments =
                assessmentService
                        .getAssessmentsByModuleId(moduleId);

        if (assessments.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                assessments,
                HttpStatus.OK
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Assessment> updateAssessment(
            @PathVariable Long id,
            @RequestBody Assessment assessment) {

        Assessment updated =
                assessmentService
                        .updateAssessment(id, assessment);

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
    public ResponseEntity<Void> deleteAssessment(
            @PathVariable Long id) {
        Optional<Assessment> assessment =
                assessmentService.getAssessmentById(id);
        if (assessment.isPresent()) {
            assessmentService.deleteAssessment(id);
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }
        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }
}