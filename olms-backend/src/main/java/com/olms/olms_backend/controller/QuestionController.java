package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.Question;
import com.olms.olms_backend.service.QuestionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(
            QuestionService questionService) {

        this.questionService = questionService;
    }

    @PostMapping
    public ResponseEntity<Question> createQuestion(
            @RequestBody Question question) {

        Question created =
                questionService.createQuestion(question);

        return new ResponseEntity<>(
                created,
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {

        List<Question> questions =
                questionService.getAllQuestions();

        if (questions.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                questions,
                HttpStatus.OK
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(
            @PathVariable Long id) {

        Optional<Question> question =
                questionService.getQuestionById(id);

        if (question.isPresent()) {
            return new ResponseEntity<>(
                    question.get(),
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @GetMapping("/assessment/{assessmentId}")
    public ResponseEntity<List<Question>>
    getQuestionsByAssessmentId(
            @PathVariable Long assessmentId) {

        List<Question> questions =
                questionService
                        .getQuestionsByAssessmentId(
                                assessmentId
                        );

        if (questions.isEmpty()) {
            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                questions,
                HttpStatus.OK
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(
            @PathVariable Long id,
            @RequestBody Question question) {

        Question updated =
                questionService.updateQuestion(
                        id,
                        question
                );

        if (updated != null) {
            return new ResponseEntity<>(
                    updated,
                    HttpStatus.OK
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long id) {

        Optional<Question> question =
                questionService.getQuestionById(id);

        if (question.isPresent()) {

            questionService.deleteQuestion(id);

            return new ResponseEntity<>(
                    HttpStatus.NO_CONTENT
            );
        }

        return new ResponseEntity<>(
                HttpStatus.NOT_FOUND
        );
    }
}