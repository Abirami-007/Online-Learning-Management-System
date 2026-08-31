package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Assessment;

import java.util.List;
import java.util.Optional;

public interface AssessmentService {

    Assessment createAssessment(Assessment assessment);

    List<Assessment> getAllAssessments();

    Optional<Assessment> getAssessmentById(Long id);

    List<Assessment> getAssessmentsByModuleId(Long moduleId);

    Assessment updateAssessment(Long id, Assessment assessment);

    void deleteAssessment(Long id);
}