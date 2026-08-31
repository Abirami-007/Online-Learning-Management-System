package com.olms.olms_backend.exception;

public class InvalidCertificateException extends RuntimeException {

    public InvalidCertificateException(String message) {
        super(message);
    }
}