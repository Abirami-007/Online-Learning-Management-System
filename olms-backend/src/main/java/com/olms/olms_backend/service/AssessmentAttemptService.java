package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.AssessmentAttempt;

import java.util.List;
import java.util.Optional;

public interface AssessmentAttemptService {

    AssessmentAttempt createAttempt(AssessmentAttempt attempt);

    List<AssessmentAttempt> getAllAttempts();

    Optional<AssessmentAttempt> getAttemptById(Long id);

    List<AssessmentAttempt> getAttemptsByAssessmentId(Long assessmentId);

    List<AssessmentAttempt> getAttemptsByUserId(Long userId);

    AssessmentAttempt updateAttempt(Long id, AssessmentAttempt attempt);

    void deleteAttempt(Long id);
}