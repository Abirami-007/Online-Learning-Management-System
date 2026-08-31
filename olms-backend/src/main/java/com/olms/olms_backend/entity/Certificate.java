package com.olms.olms_backend.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "certificates")
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String certificateName;
    private String certificateUrl;

    private String issuedDate;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    public Certificate() {
    }
    public Certificate(String certificateName,
                       String certificateUrl,
                       String issuedDate,
                       User user) {
        this.certificateName = certificateName;
        this.certificateUrl = certificateUrl;
        this.issuedDate = issuedDate;
        this.user = user;
    }
    public Certificate(String certificateName,
                       String certificateUrl,
                       String issuedDate,
                       User user,
                       Course course) {
        this.certificateName = certificateName;
        this.certificateUrl = certificateUrl;
        this.issuedDate = issuedDate;
        this.user = user;
        this.course = course;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCertificateName() {
        return certificateName;
    }

    public void setCertificateName(String certificateName) {
        this.certificateName = certificateName;
    }

    public String getCertificateUrl() {
        return certificateUrl;
    }

    public void setCertificateUrl(String certificateUrl) {
        this.certificateUrl = certificateUrl;
    }

    public String getIssuedDate() {
        return issuedDate;
    }

    public void setIssuedDate(String issuedDate) {
        this.issuedDate = issuedDate;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }
}