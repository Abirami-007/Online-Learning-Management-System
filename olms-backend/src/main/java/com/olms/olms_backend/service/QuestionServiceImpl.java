package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Assessment;
import com.olms.olms_backend.entity.Question;
import com.olms.olms_backend.repository.AssessmentRepository;
import com.olms.olms_backend.repository.QuestionRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final AssessmentRepository assessmentRepository;

    public QuestionServiceImpl(
            QuestionRepository questionRepository,
            AssessmentRepository assessmentRepository) {

        this.questionRepository = questionRepository;
        this.assessmentRepository = assessmentRepository;
    }

    @Override
    public Question createQuestion(Question question) {

        if (question.getAssessment() == null ||
                question.getAssessment().getId() == null) {

            throw new RuntimeException(
                    "Assessment ID is required"
            );
        }

        Long assessmentId =
                question.getAssessment().getId();

        Assessment assessment =
                assessmentRepository.findById(assessmentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Assessment not found with id: "
                                                + assessmentId
                                ));

        question.setAssessment(assessment);

        return questionRepository.save(question);
    }

    @Override
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    @Override
    public Optional<Question> getQuestionById(Long id) {
        return questionRepository.findById(id);
    }

    @Override
    public List<Question> getQuestionsByAssessmentId(
            Long assessmentId) {

        return questionRepository
                .findByAssessmentId(assessmentId);
    }

    @Override
    public Question updateQuestion(
            Long id,
            Question question) {

        Optional<Question> existingQuestion =
                questionRepository.findById(id);

        if (existingQuestion.isEmpty()) {
            return null;
        }

        Question existing =
                existingQuestion.get();

        existing.setQuestionText(
                question.getQuestionText()
        );

        existing.setOptionA(
                question.getOptionA()
        );

        existing.setOptionB(
                question.getOptionB()
        );

        existing.setOptionC(
                question.getOptionC()
        );

        existing.setOptionD(
                question.getOptionD()
        );

        existing.setCorrectAnswer(
                question.getCorrectAnswer()
        );

        existing.setMarks(
                question.getMarks()
        );

        if (question.getAssessment() != null &&
                question.getAssessment().getId() != null) {

            Long assessmentId =
                    question.getAssessment().getId();

            Assessment assessment =
                    assessmentRepository.findById(assessmentId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Assessment not found with id: "
                                                    + assessmentId
                                    ));

            existing.setAssessment(assessment);
        }

        return questionRepository.save(existing);
    }

    @Override
    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }
}