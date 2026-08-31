package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.CourseModule;

import java.util.List;
import java.util.Optional;

public interface CourseModuleService {

    CourseModule createCourseModule(CourseModule courseModule);

    List<CourseModule> getAllCourseModules();

    Optional<CourseModule> getCourseModuleById(Long id);

    List<CourseModule> getCourseModulesByCourseId(Long courseId);

    CourseModule updateCourseModule(Long id, CourseModule courseModule);

    void deleteCourseModule(Long id);
}