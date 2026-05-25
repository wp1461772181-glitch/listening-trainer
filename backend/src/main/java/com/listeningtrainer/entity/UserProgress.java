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

    private int attempts;

    private int bestScore;

    private LocalDate date;

    public UserProgress() {}

    public UserProgress(Long userId, String lessonId, int score, int attempts, int bestScore, LocalDate date) {
        this.userId = userId;
        this.lessonId = lessonId;
        this.score = score;
        this.attempts = attempts;
        this.bestScore = bestScore;
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

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public int getBestScore() { return bestScore; }
    public void setBestScore(int bestScore) { this.bestScore = bestScore; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
