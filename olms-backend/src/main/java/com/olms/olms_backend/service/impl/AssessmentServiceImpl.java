package com.olms.olms_backend.service.impl;

import com.olms.olms_backend.service.*;

import com.olms.olms_backend.entity.Assessment;
import com.olms.olms_backend.entity.CourseModule;
import com.olms.olms_backend.repository.AssessmentRepository;
import com.olms.olms_backend.repository.CourseModuleRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AssessmentServiceImpl implements AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final CourseModuleRepository courseModuleRepository;

    public AssessmentServiceImpl(
            AssessmentRepository assessmentRepository,
            CourseModuleRepository courseModuleRepository) {

        this.assessmentRepository = assessmentRepository;
        this.courseModuleRepository = courseModuleRepository;
    }

    @Override
    public Assessment createAssessment(Assessment assessment) {

        if (assessment.getModule() == null ||
                assessment.getModule().getId() == null) {

            throw new RuntimeException(
                    "Module ID is required"
            );
        }

        Long moduleId = assessment.getModule().getId();

        CourseModule module = courseModuleRepository
                .findById(moduleId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Course Module not found with id: "
                                        + moduleId
                        ));

        assessment.setModule(module);

        return assessmentRepository.save(assessment);
    }

    @Override
    public List<Assessment> getAllAssessments() {
        return assessmentRepository.findAll();
    }

    @Override
    public Optional<Assessment> getAssessmentById(Long id) {
        return assessmentRepository.findById(id);
    }

    @Override
    public List<Assessment> getAssessmentsByModuleId(
            Long moduleId) {

        return assessmentRepository
                .findByModuleId(moduleId);
    }

    @Override
    public Assessment updateAssessment(
            Long id,
            Assessment assessment) {

        Optional<Assessment> existingAssessment =
                assessmentRepository.findById(id);

        if (existingAssessment.isEmpty()) {
            return null;
        }

        Assessment existing = existingAssessment.get();

        existing.setTitle(assessment.getTitle());
        existing.setDescription(assessment.getDescription());
        existing.setTotalMarks(assessment.getTotalMarks());
        existing.setPassingMarks(assessment.getPassingMarks());

        if (assessment.getModule() != null &&
                assessment.getModule().getId() != null) {

            Long moduleId =
                    assessment.getModule().getId();

            CourseModule module =
                    courseModuleRepository.findById(moduleId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Course Module not found with id: "
                                                    + moduleId
                                    ));

            existing.setModule(module);
        }

        return assessmentRepository.save(existing);
    }

    @Override
    public void deleteAssessment(Long id) {
        assessmentRepository.deleteById(id);
    }
}
