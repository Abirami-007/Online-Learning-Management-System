package com.olms.olms_backend.repository;

import com.olms.olms_backend.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
    java.util.List<Certificate> findByUserId(Long userId);
}