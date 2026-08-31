package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Question;

import java.util.List;
import java.util.Optional;

public interface QuestionService {

    Question createQuestion(Question question);

    List<Question> getAllQuestions();

    Optional<Question> getQuestionById(Long id);

    List<Question> getQuestionsByAssessmentId(Long assessmentId);

    Question updateQuestion(Long id, Question question);

    void deleteQuestion(Long id);
}