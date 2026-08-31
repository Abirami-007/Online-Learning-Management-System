package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.LessonProgress;

import java.util.List;

public interface LessonProgressService {

    LessonProgress createProgress(LessonProgress progress);

    List<LessonProgress> getAllProgress();

    LessonProgress getProgressById(Long id);

    LessonProgress updateProgress(Long id, LessonProgress progress);

    void deleteProgress(Long id);
}