package com.olms.olms_backend.controller;
import com.olms.olms_backend.entity.Certificate;
import com.olms.olms_backend.repository.UserRepository;
import com.olms.olms_backend.service.CertificateService;
import com.olms.olms_backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
@RestController
@RequestMapping("/api/certificates")
public class CertificateController {
    private final CertificateService service;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public CertificateController(CertificateService service,
                                  JwtUtil jwtUtil,
                                  UserRepository userRepository) {
        this.service = service;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Certificate> createCertificate(
            @RequestBody Certificate certificate) {

        return new ResponseEntity<>(
                service.createCertificate(certificate),
                HttpStatus.CREATED
        );
    }
    @GetMapping
    public ResponseEntity<List<Certificate>> getAllCertificates() {
        return ResponseEntity.ok(service.getAllCertificates());
    }
    // GET MY CERTIFICATES (current logged-in user)
    @GetMapping("/my")
    public ResponseEntity<List<Certificate>> getMyCertificates(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        Long userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"))
                .getId();
        return ResponseEntity.ok(service.getCertificatesByUserId(userId));
    }
    @GetMapping("/{id}")
    public ResponseEntity<Certificate> getCertificateById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                service.getCertificateById(id)
        );
    }
    @PutMapping("/{id}")
    public ResponseEntity<Certificate> updateCertificate(
            @PathVariable Long id,
            @RequestBody Certificate certificate) {

        return ResponseEntity.ok(
                service.updateCertificate(id, certificate)
        );
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCertificate(
            @PathVariable Long id) {

        service.deleteCertificate(id);
        return ResponseEntity.noContent().build();
    }
}