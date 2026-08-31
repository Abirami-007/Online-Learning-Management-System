package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.CourseModule;
import com.olms.olms_backend.service.CourseModuleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/course-modules")
public class CourseModuleController {

    private final CourseModuleService courseModuleService;

    public CourseModuleController(CourseModuleService courseModuleService) {
        this.courseModuleService = courseModuleService;
    }

    @PostMapping
    public ResponseEntity<CourseModule> createCourseModule(
            @RequestBody CourseModule courseModule) {

        CourseModule createdModule =
                courseModuleService.createCourseModule(courseModule);

        return new ResponseEntity<>(
                createdModule,
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<CourseModule>> getAllCourseModules() {

        List<CourseModule> modules =
                courseModuleService.getAllCourseModules();

        if (modules.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                modules,
                HttpStatus.OK
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseModule> getCourseModuleById(
            @PathVariable Long id) {

        Optional<CourseModule> module =
                courseModuleService.getCourseModuleById(id);

        if (module.isPresent()) {
            return new ResponseEntity<>(
                    module.get(),
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseModule>> getCourseModulesByCourseId(
            @PathVariable Long courseId) {

        List<CourseModule> modules =
                courseModuleService.getCourseModulesByCourseId(courseId);

        if (modules.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                modules,
                HttpStatus.OK
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseModule> updateCourseModule(
            @PathVariable Long id,
            @RequestBody CourseModule courseModule) {

        CourseModule updatedModule =
                courseModuleService.updateCourseModule(
                        id,
                        courseModule
                );

        if (updatedModule != null) {
            return new ResponseEntity<>(
                    updatedModule,
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourseModule(
            @PathVariable Long id) {

        Optional<CourseModule> module =
                courseModuleService.getCourseModuleById(id);

        if (module.isPresent()) {

            courseModuleService.deleteCourseModule(id);

            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }
}