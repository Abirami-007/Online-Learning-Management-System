package com.olms.olms_backend.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 5000)
    private String description;

    @Column(length = 10000)
    private String content;

    @Column(name = "video_url")
    @JsonProperty("videoUrl")
    @JsonAlias({"video_url", "videoURL", "contentUrl", "url"})
    private String videoUrl;

    private int lessonOrder;

    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;

    // Default constructor
    public Lesson() {
    }

    // Parameterized constructor
    public Lesson(
            String title,
            String description,
            String content,
            String videoUrl,
            int lessonOrder,
            CourseModule module) {

        this.title = title;
        this.description = description;
        this.content = content;
        this.videoUrl = videoUrl;
        this.lessonOrder = lessonOrder;
        this.module = module;
    }

    // Getters and Setters

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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @JsonProperty("videoUrl")
    public String getVideoUrl() {
        return videoUrl;
    }

    @JsonProperty("video_url")
    public String getVideoUrlSnake() {
        return videoUrl;
    }

    @JsonProperty("videoUrl")
    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    @JsonProperty("video_url")
    public void setVideoUrlSnake(String videoUrl) {
        this.videoUrl = videoUrl;
    }


    public int getLessonOrder() {
        return lessonOrder;
    }

    public void setLessonOrder(int lessonOrder) {
        this.lessonOrder = lessonOrder;
    }

    public CourseModule getModule() {
        return module;
    }

    public void setModule(CourseModule module) {
        this.module = module;
    }
}

