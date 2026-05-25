package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDate;

@TableName("user_progress_summary")
public class UserProgressSummary {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String lessonId;

    private int latestScore;

    private int bestScore;

    private int totalAttempts;

    private LocalDate lastDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public int getLatestScore() { return latestScore; }
    public void setLatestScore(int latestScore) { this.latestScore = latestScore; }

    public int getBestScore() { return bestScore; }
    public void setBestScore(int bestScore) { this.bestScore = bestScore; }

    public int getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(int totalAttempts) { this.totalAttempts = totalAttempts; }

    public LocalDate getLastDate() { return lastDate; }
    public void setLastDate(LocalDate lastDate) { this.lastDate = lastDate; }
}
