package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.Lesson;
import com.olms.olms_backend.service.LessonService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping
    public ResponseEntity<Lesson> createLesson(
            @RequestBody Lesson lesson) {

        Lesson createdLesson =
                lessonService.createLesson(lesson);

        return new ResponseEntity<>(
                createdLesson,
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<Lesson>> getAllLessons() {

        List<Lesson> lessons =
                lessonService.getAllLessons();

        if (lessons.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                lessons,
                HttpStatus.OK
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lesson> getLessonById(
            @PathVariable Long id) {

        Optional<Lesson> lesson =
                lessonService.getLessonById(id);

        if (lesson.isPresent()) {
            return new ResponseEntity<>(
                    lesson.get(),
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<Lesson>> getLessonsByModuleId(
            @PathVariable Long moduleId) {

        List<Lesson> lessons =
                lessonService.getLessonsByModuleId(moduleId);

        if (lessons.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        return new ResponseEntity<>(
                lessons,
                HttpStatus.OK
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lesson> updateLesson(
            @PathVariable Long id,
            @RequestBody Lesson lesson) {

        Lesson updatedLesson =
                lessonService.updateLesson(id, lesson);

        if (updatedLesson != null) {
            return new ResponseEntity<>(
                    updatedLesson,
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(
            @PathVariable Long id) {

        Optional<Lesson> lesson =
                lessonService.getLessonById(id);

        if (lesson.isPresent()) {

            lessonService.deleteLesson(id);

            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }
}