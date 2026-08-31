package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.CourseModule;
import com.olms.olms_backend.repository.CourseModuleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseModuleServiceImpl implements CourseModuleService {

    private final CourseModuleRepository courseModuleRepository;

    public CourseModuleServiceImpl(
            CourseModuleRepository courseModuleRepository) {

        this.courseModuleRepository = courseModuleRepository;
    }

    @Override
    public CourseModule createCourseModule(CourseModule courseModule) {
        return courseModuleRepository.save(courseModule);
    }

    @Override
    public List<CourseModule> getAllCourseModules() {
        return courseModuleRepository.findAll();
    }

    @Override
    public Optional<CourseModule> getCourseModuleById(Long id) {
        return courseModuleRepository.findById(id);
    }

    @Override
    public List<CourseModule> getCourseModulesByCourseId(Long courseId) {
        return courseModuleRepository.findByCourseId(courseId);
    }

    @Override
    public CourseModule updateCourseModule(
            Long id,
            CourseModule courseModule) {

        Optional<CourseModule> existingModule =
                courseModuleRepository.findById(id);

        if (existingModule.isPresent()) {

            CourseModule updatedModule = existingModule.get();

            updatedModule.setTitle(courseModule.getTitle());
            updatedModule.setDescription(courseModule.getDescription());
            updatedModule.setModuleOrder(courseModule.getModuleOrder());
            updatedModule.setCourse(courseModule.getCourse());

            return courseModuleRepository.save(updatedModule);
        }

        return null;
    }

    @Override
    public void deleteCourseModule(Long id) {
        courseModuleRepository.deleteById(id);
    }
}