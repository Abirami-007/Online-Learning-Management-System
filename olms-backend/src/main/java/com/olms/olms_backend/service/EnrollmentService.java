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
import java.util.Optional;

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

    // CREATE — enrolls learner, idempotent if already enrolled
    public Enrollment createEnrollment(Enrollment enrollment, String authHeader) {
        if (authHeader != null && authHeader.trim().startsWith("Bearer ")) {
            try {
                String token = authHeader.trim().substring(7).trim();
                String email = jwtUtil.extractEmail(token);
                userRepository.findByEmailIgnoreCase(email).ifPresent(u -> enrollment.setUserId(u.getId()));
            } catch (Exception ignored) {
            }
        }
        if (enrollment.getUserId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User ID is required for enrollment"
            );
        }
        if (enrollment.getCourseId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course ID is required for enrollment"
            );
        }

        Optional<Enrollment> existingOpt = enrollmentRepository
                .findByUserIdAndCourseId(enrollment.getUserId(), enrollment.getCourseId());
        if (existingOpt.isPresent()) {
            Enrollment existing = existingOpt.get();
            if (!existing.isActive()) {
                existing.setActive(true);
                return enrollmentRepository.save(existing);
            }
            return existing; // Idempotent: return existing active enrollment
        }

        enrollment.setActive(true);
        return enrollmentRepository.save(enrollment);
    }

    // GET ALL (admin use)
    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    // GET ENROLLMENTS FOR CURRENT USER (from JWT or fallback userId)
    public List<Enrollment> getEnrollmentsForCurrentUser(String authHeader, Long userIdFallback) {
        Long resolvedUserId = null;
        if (authHeader != null && authHeader.trim().startsWith("Bearer ")) {
            try {
                String token = authHeader.trim().substring(7).trim();
                String email = jwtUtil.extractEmail(token);
                User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
                if (user != null) {
                    resolvedUserId = user.getId();
                }
            } catch (Exception ignored) {
            }
        }
        if (resolvedUserId == null && userIdFallback != null) {
            resolvedUserId = userIdFallback;
        }
        if (resolvedUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to fetch enrollments");
        }
        return enrollmentRepository.findByUserId(resolvedUserId);
    }

    public boolean isUserEnrolled(Long userId, Long courseId) {
        if (userId == null || courseId == null) return false;
        return enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);
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