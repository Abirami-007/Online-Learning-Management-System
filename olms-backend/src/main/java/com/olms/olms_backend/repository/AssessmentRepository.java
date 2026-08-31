package com.olms.olms_backend.repository;

import com.olms.olms_backend.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentRepository
        extends JpaRepository<Assessment, Long> {

    List<Assessment> findByModuleId(Long moduleId);
}