package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.LessonProgress;
import com.olms.olms_backend.repository.LessonProgressRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LessonProgressServiceImpl implements LessonProgressService {

    private final LessonProgressRepository repository;

    public LessonProgressServiceImpl(LessonProgressRepository repository) {
        this.repository = repository;
    }

    @Override
    public LessonProgress createProgress(LessonProgress progress) {
        return repository.save(progress);
    }

    @Override
    public List<LessonProgress> getAllProgress() {
        return repository.findAll();
    }

    @Override
    public LessonProgress getProgressById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "LessonProgress not found with id: " + id
                        ));
    }

    @Override
    public LessonProgress updateProgress(Long id, LessonProgress progress) {

        LessonProgress existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "LessonProgress not found with id: " + id
                        ));

        existing.setCompleted(progress.isCompleted());
        existing.setProgressPercentage(progress.getProgressPercentage());

        return repository.save(existing);
    }

    @Override
    public void deleteProgress(Long id) {

        LessonProgress existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "LessonProgress not found with id: " + id
                        ));

        repository.delete(existing);
    }
}