package com.olms.olms_backend.repository;

import com.olms.olms_backend.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByModule_Id(Long moduleId);

    List<Lesson> findByModule_IdOrderByLessonOrderAsc(Long moduleId);
}


