package com.olms.olms_backend.repository;

import com.olms.olms_backend.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseModuleRepository
        extends JpaRepository<CourseModule, Long> {

    List<CourseModule> findByCourseId(Long courseId);
}