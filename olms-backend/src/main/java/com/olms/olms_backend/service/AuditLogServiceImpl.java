package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.AuditLog;
import com.olms.olms_backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository repository;

    public AuditLogServiceImpl(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Override
    public AuditLog createAuditLog(AuditLog auditLog) {
        return repository.save(auditLog);
    }

    @Override
    public List<AuditLog> getAllAuditLogs() {
        return repository.findAll();
    }

    @Override
    public AuditLog getAuditLogById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "AuditLog not found with id: " + id
                        ));
    }

    @Override
    public AuditLog updateAuditLog(Long id, AuditLog auditLog) {

        AuditLog existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "AuditLog not found with id: " + id
                        ));

        existing.setAction(auditLog.getAction());
        existing.setEntityName(auditLog.getEntityName());
        existing.setEntityId(auditLog.getEntityId());
        existing.setDetails(auditLog.getDetails());
        existing.setTimestamp(auditLog.getTimestamp());
        existing.setUser(auditLog.getUser());

        return repository.save(existing);
    }

    @Override
    public void deleteAuditLog(Long id) {

        AuditLog existing = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "AuditLog not found with id: " + id
                        ));

        repository.delete(existing);
    }
}
