package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.Discussion;
import com.olms.olms_backend.service.DiscussionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discussions")
public class DiscussionController {

    private final DiscussionService service;

    public DiscussionController(DiscussionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Discussion> createDiscussion(
            @RequestBody Discussion discussion) {

        return new ResponseEntity<>(
                service.createDiscussion(discussion),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<Discussion>> getAllDiscussions() {
        return ResponseEntity.ok(service.getAllDiscussions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Discussion> getDiscussionById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                service.getDiscussionById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Discussion> updateDiscussion(
            @PathVariable Long id,
            @RequestBody Discussion discussion) {

        return ResponseEntity.ok(
                service.updateDiscussion(id, discussion)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiscussion(
            @PathVariable Long id) {

        service.deleteDiscussion(id);

        return ResponseEntity.noContent().build();
    }
}