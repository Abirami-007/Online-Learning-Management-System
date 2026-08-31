package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Certificate;

import java.util.List;

public interface CertificateService {

    Certificate createCertificate(Certificate certificate);

    List<Certificate> getAllCertificates();

    List<Certificate> getCertificatesByUserId(Long userId);

    Certificate getCertificateById(Long id);

    Certificate updateCertificate(Long id, Certificate certificate);

    void deleteCertificate(Long id);
}