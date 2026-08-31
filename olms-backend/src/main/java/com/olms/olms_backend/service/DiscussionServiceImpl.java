package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Discussion;
import com.olms.olms_backend.repository.DiscussionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DiscussionServiceImpl implements DiscussionService {

    private final DiscussionRepository repository;

    public DiscussionServiceImpl(DiscussionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Discussion createDiscussion(Discussion discussion) {
        return repository.save(discussion);
    }

    @Override
    public List<Discussion> getAllDiscussions() {
        return repository.findAll();
    }

    @Override
    public Discussion getDiscussionById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Discussion not found with id: " + id
                        ));
    }

    @Override
    public Discussion updateDiscussion(Long id, Discussion discussion) {

        Discussion existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Discussion not found with id: " + id
                        ));

        existing.setTitle(discussion.getTitle());
        existing.setContent(discussion.getContent());
        existing.setUser(discussion.getUser());
        existing.setLesson(discussion.getLesson());

        return repository.save(existing);
    }

    @Override
    public void deleteDiscussion(Long id) {

        Discussion existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Discussion not found with id: " + id
                        ));

        repository.delete(existing);
    }
}