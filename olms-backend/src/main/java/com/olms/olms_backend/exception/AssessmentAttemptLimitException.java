package com.olms.olms_backend.exception;

public class AssessmentAttemptLimitException extends RuntimeException {

    public AssessmentAttemptLimitException(String message) {
        super(message);
    }
}