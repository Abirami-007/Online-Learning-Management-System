package com.olms.olms_backend.repository;

import com.olms.olms_backend.entity.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentAttemptRepository
        extends JpaRepository<AssessmentAttempt, Long> {

    List<AssessmentAttempt> findByAssessmentId(Long assessmentId);

    List<AssessmentAttempt> findByUserId(Long userId);
}