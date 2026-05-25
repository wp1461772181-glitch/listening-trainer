package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDate;

@TableName("user_progress")
public class UserProgress {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String lessonId;

    private int score;

    private LocalDate date;

    public UserProgress() {}

    public UserProgress(Long userId, String lessonId, int score, LocalDate date) {
        this.userId = userId;
        this.lessonId = lessonId;
        this.score = score;
        this.date = date;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
