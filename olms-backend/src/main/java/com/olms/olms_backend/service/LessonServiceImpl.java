package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.CourseModule;
import com.olms.olms_backend.entity.Lesson;
import com.olms.olms_backend.repository.CourseModuleRepository;
import com.olms.olms_backend.repository.LessonRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final CourseModuleRepository courseModuleRepository;

    public LessonServiceImpl(
            LessonRepository lessonRepository,
            CourseModuleRepository courseModuleRepository) {

        this.lessonRepository = lessonRepository;
        this.courseModuleRepository = courseModuleRepository;
    }

    // CREATE LESSON
    @Override
    public Lesson createLesson(Lesson lesson) {

        if (lesson.getModule() == null ||
                lesson.getModule().getId() == null) {

            throw new RuntimeException("Course Module ID is required");
        }

        Long moduleId = lesson.getModule().getId();

        CourseModule module = courseModuleRepository
                .findById(moduleId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Course Module not found with id: " + moduleId
                        )
                );

        lesson.setModule(module);

        return lessonRepository.save(lesson);
    }

    // GET ALL LESSONS
    @Override
    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }

    // GET LESSON BY ID
    @Override
    public Optional<Lesson> getLessonById(Long id) {
        return lessonRepository.findById(id);
    }

    // GET LESSONS BY MODULE ID
    @Override
    public List<Lesson> getLessonsByModuleId(Long moduleId) {
        return lessonRepository.findByModule_Id(moduleId);
    }

    // UPDATE LESSON
    @Override
    public Lesson updateLesson(Long id, Lesson lesson) {

        Optional<Lesson> existingLesson =
                lessonRepository.findById(id);

        if (existingLesson.isEmpty()) {
            return null;
        }

        Lesson updatedLesson = existingLesson.get();

        updatedLesson.setTitle(lesson.getTitle());
        updatedLesson.setDescription(lesson.getDescription());
        updatedLesson.setContent(lesson.getContent());
        updatedLesson.setVideoUrl(lesson.getVideoUrl());
        updatedLesson.setLessonOrder(lesson.getLessonOrder());

        // Update module if provided
        if (lesson.getModule() != null &&
                lesson.getModule().getId() != null) {

            Long moduleId = lesson.getModule().getId();

            CourseModule module = courseModuleRepository
                    .findById(moduleId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Course Module not found with id: " + moduleId
                            )
                    );

            updatedLesson.setModule(module);
        }

        return lessonRepository.save(updatedLesson);
    }

    // DELETE LESSON
    @Override
    public void deleteLesson(Long id) {
        lessonRepository.deleteById(id);
    }
}
