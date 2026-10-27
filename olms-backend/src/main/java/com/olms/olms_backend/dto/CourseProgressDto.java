package com.olms.olms_backend.dto;

import java.util.List;

public class CourseProgressDto {

    private Long courseId;
    private String courseTitle;
    private int totalLessons;
    private int completedLessons;
    private int progressPercent;
    private boolean enrolled = true;
    private List<ModuleStatusDto> modules;

    public CourseProgressDto() {
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public int getTotalLessons() {
        return totalLessons;
    }

    public void setTotalLessons(int totalLessons) {
        this.totalLessons = totalLessons;
    }

    public int getCompletedLessons() {
        return completedLessons;
    }

    public void setCompletedLessons(int completedLessons) {
        this.completedLessons = completedLessons;
    }

    public int getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(int progressPercent) {
        this.progressPercent = progressPercent;
    }

    public boolean isEnrolled() {
        return enrolled;
    }

    public void setEnrolled(boolean enrolled) {
        this.enrolled = enrolled;
    }

    public List<ModuleStatusDto> getModules() {
        return modules;
    }

    public void setModules(List<ModuleStatusDto> modules) {
        this.modules = modules;
    }
}
