package com.olms.olms_backend.dto;

import java.util.List;

public class ModuleStatusDto {

    private Long moduleId;
    private String title;
    private int moduleOrder;
    private boolean completed;
    private boolean locked;
    private List<LessonStatusDto> lessons;
    private List<AssessmentStatusDto> assessments;

    public ModuleStatusDto() {
    }

    public Long getModuleId() {
        return moduleId;
    }

    public void setModuleId(Long moduleId) {
        this.moduleId = moduleId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public int getModuleOrder() {
        return moduleOrder;
    }

    public void setModuleOrder(int moduleOrder) {
        this.moduleOrder = moduleOrder;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public boolean isLocked() {
        return locked;
    }

    public void setLocked(boolean locked) {
        this.locked = locked;
    }

    public List<LessonStatusDto> getLessons() {
        return lessons;
    }

    public void setLessons(List<LessonStatusDto> lessons) {
        this.lessons = lessons;
    }

    public List<AssessmentStatusDto> getAssessments() {
        return assessments;
    }

    public void setAssessments(List<AssessmentStatusDto> assessments) {
        this.assessments = assessments;
    }
}
