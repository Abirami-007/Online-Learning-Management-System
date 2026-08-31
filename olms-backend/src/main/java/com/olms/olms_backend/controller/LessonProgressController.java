package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.LessonProgress;
import com.olms.olms_backend.service.LessonProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lesson-progress")
public class LessonProgressController {

    private final LessonProgressService service;

    public LessonProgressController(LessonProgressService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LessonProgress> createProgress(
            @RequestBody LessonProgress progress) {

        return new ResponseEntity<>(
                service.createProgress(progress),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<LessonProgress>> getAllProgress() {
        return ResponseEntity.ok(service.getAllProgress());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonProgress> getProgressById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getProgressById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LessonProgress> updateProgress(
            @PathVariable Long id,
            @RequestBody LessonProgress progress) {

        return ResponseEntity.ok(
                service.updateProgress(id, progress)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgress(
            @PathVariable Long id) {

        service.deleteProgress(id);
        return ResponseEntity.noContent().build();
    }
}