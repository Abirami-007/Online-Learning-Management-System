package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.AuditLog;

import java.util.List;

public interface AuditLogService {

    AuditLog createAuditLog(AuditLog auditLog);

    List<AuditLog> getAllAuditLogs();

    AuditLog getAuditLogById(Long id);

    AuditLog updateAuditLog(Long id, AuditLog auditLog);

    void deleteAuditLog(Long id);
}

