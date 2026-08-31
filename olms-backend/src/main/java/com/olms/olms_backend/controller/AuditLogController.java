package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.AuditLog;
import com.olms.olms_backend.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService service;

    public AuditLogController(AuditLogService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<AuditLog> createAuditLog(
            @RequestBody AuditLog auditLog) {

        return new ResponseEntity<>(
                service.createAuditLog(auditLog),
                HttpStatus.CREATED
        );
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(service.getAllAuditLogs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> getAuditLogById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                service.getAuditLogById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuditLog> updateAuditLog(
            @PathVariable Long id,
            @RequestBody AuditLog auditLog) {

        return ResponseEntity.ok(
                service.updateAuditLog(id, auditLog)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAuditLog(
            @PathVariable Long id) {

        service.deleteAuditLog(id);

        return ResponseEntity.noContent().build();
    }
}

