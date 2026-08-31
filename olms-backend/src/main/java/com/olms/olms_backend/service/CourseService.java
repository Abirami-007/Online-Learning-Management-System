package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Course;
import com.olms.olms_backend.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    // CREATE
    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    // GET ALL
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    // GET ONE
    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    // UPDATE
    public Course updateCourse(Long id, Course updatedCourse) {

        Course existingCourse = getCourseById(id);

        existingCourse.setTitle(updatedCourse.getTitle());
        existingCourse.setDescription(updatedCourse.getDescription());
        existingCourse.setCategory(updatedCourse.getCategory());
        existingCourse.setLevel(updatedCourse.getLevel());
        existingCourse.setInstructor(updatedCourse.getInstructor());
        existingCourse.setPublished(updatedCourse.isPublished());

        return courseRepository.save(existingCourse);
    }

    // DELETE
    public void deleteCourse(Long id) {
        Course existingCourse = getCourseById(id);

        courseRepository.delete(existingCourse);
    }
}