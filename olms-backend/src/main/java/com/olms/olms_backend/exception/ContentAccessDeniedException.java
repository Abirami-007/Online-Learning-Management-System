package com.olms.olms_backend.exception;

public class ContentAccessDeniedException extends RuntimeException {

    public ContentAccessDeniedException(String message) {
        super(message);
    }
}