package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Enrollment;
import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.repository.EnrollmentRepository;
import com.olms.olms_backend.repository.UserRepository;
import com.olms.olms_backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                              UserRepository userRepository,
                              JwtUtil jwtUtil) {
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // CREATE — prevents duplicate enrollments
    public Enrollment createEnrollment(Enrollment enrollment, String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.replace("Bearer ", "");
                String email = jwtUtil.extractEmail(token);
                userRepository.findByEmail(email).ifPresent(u -> enrollment.setUserId(u.getId()));
            } catch (Exception e) {
                // Ignore and fallback to provided userId if parsing fails
            }
        }
        if (enrollment.getUserId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User ID is required for enrollment"
            );
        }
        boolean alreadyEnrolled = enrollmentRepository
                .existsByUserIdAndCourseId(enrollment.getUserId(), enrollment.getCourseId());
        if (alreadyEnrolled) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "User is already enrolled in this course"
            );
        }
        return enrollmentRepository.save(enrollment);
    }

    // GET ALL (admin use)
    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    // GET ENROLLMENTS FOR CURRENT USER (from JWT)
    public List<Enrollment> getEnrollmentsForCurrentUser(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return enrollmentRepository.findByUserId(user.getId());
    }

    // GET ONE
    public Enrollment getEnrollmentById(Long id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
    }

    // DELETE
    public void deleteEnrollment(Long id) {
        Enrollment enrollment = getEnrollmentById(id);
        enrollmentRepository.delete(enrollment);
    }
}