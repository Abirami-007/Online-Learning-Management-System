package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Certificate;
import com.olms.olms_backend.repository.CertificateRepository;
import com.olms.olms_backend.repository.CourseRepository;
import com.olms.olms_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CertificateServiceImpl implements CertificateService {

    private final CertificateRepository repository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public CertificateServiceImpl(CertificateRepository repository,
                                   CourseRepository courseRepository,
                                   UserRepository userRepository) {
        this.repository = repository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Certificate createCertificate(Certificate certificate) {
        if (certificate.getCourse() != null && certificate.getCourse().getId() != null) {
            courseRepository.findById(certificate.getCourse().getId()).ifPresent(certificate::setCourse);
        }
        if (certificate.getUser() != null && certificate.getUser().getId() != null) {
            userRepository.findById(certificate.getUser().getId()).ifPresent(certificate::setUser);
        }
        return repository.save(certificate);
    }

    @Override
    public List<Certificate> getAllCertificates() {
        return repository.findAll();
    }

    @Override
    public List<Certificate> getCertificatesByUserId(Long userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public Certificate getCertificateById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Certificate not found with id: " + id
                        ));
    }

    @Override
    public Certificate updateCertificate(Long id, Certificate certificate) {

        Certificate existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Certificate not found with id: " + id
                        ));

        existing.setCertificateName(certificate.getCertificateName());
        existing.setCertificateUrl(certificate.getCertificateUrl());
        existing.setIssuedDate(certificate.getIssuedDate());
        if (certificate.getUser() != null && certificate.getUser().getId() != null) {
            userRepository.findById(certificate.getUser().getId()).ifPresent(existing::setUser);
        }
        if (certificate.getCourse() != null && certificate.getCourse().getId() != null) {
            courseRepository.findById(certificate.getCourse().getId()).ifPresent(existing::setCourse);
        }

        return repository.save(existing);
    }

    @Override
    public void deleteCertificate(Long id) {

        Certificate existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Certificate not found with id: " + id
                        ));

        repository.delete(existing);
    }
}