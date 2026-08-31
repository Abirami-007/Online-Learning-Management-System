package com.olms.olms_backend.controller;
import com.olms.olms_backend.entity.Enrollment;
import com.olms.olms_backend.service.EnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }
    // CREATE ENROLLMENT
    @PostMapping
    public ResponseEntity<Enrollment> createEnrollment(
            @RequestBody Enrollment enrollment,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return ResponseEntity.ok(
                enrollmentService.createEnrollment(enrollment, authHeader)
        );
    }
    // GET ALL ENROLLMENTS (admin)
    @GetMapping
    public ResponseEntity<List<Enrollment>> getAllEnrollments() {

        return ResponseEntity.ok(
                enrollmentService.getAllEnrollments()
        );
    }
    // GET MY ENROLLMENTS (current logged-in user)
    @GetMapping("/my")
    public ResponseEntity<List<Enrollment>> getMyEnrollments(
            @RequestHeader("Authorization") String authHeader) {

        return ResponseEntity.ok(
                enrollmentService.getEnrollmentsForCurrentUser(authHeader)
        );
    }
    // GET ENROLLMENT BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Enrollment> getEnrollmentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                enrollmentService.getEnrollmentById(id)
        );
    }
    // DELETE ENROLLMENT
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEnrollment(
            @PathVariable Long id) {

        enrollmentService.deleteEnrollment(id);

        return ResponseEntity.ok(
                "Enrollment deleted successfully"
        );
    }
}