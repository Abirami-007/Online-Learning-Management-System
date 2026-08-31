package com.olms.olms_backend.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "course_modules")
public class CourseModule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String description;
    private int moduleOrder;
    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    public CourseModule() {
    }
    public CourseModule(String title,
                        String description,
                        int moduleOrder,
                        Course course) {
        this.title = title;
        this.description = description;
        this.moduleOrder = moduleOrder;
        this.course = course;
    }
    public Long getId() {
        return id;
    }
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getModuleOrder() {
        return moduleOrder;
    }

    public void setModuleOrder(int moduleOrder) {
        this.moduleOrder = moduleOrder;
    }

    public Course getCourse() {
        return course;
    }
    public void setCourse(Course course) {
        this.course = course;
    }
}
