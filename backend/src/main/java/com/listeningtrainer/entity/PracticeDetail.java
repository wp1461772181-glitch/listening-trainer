package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDate;

@TableName("practice_details")
public class PracticeDetail {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long progressId;
    private Long userId;
    private String lessonId;
    private String keywords;
    private String reconstruction;
    private String diffJson;
    private int listenCount;
    private int score;
    private LocalDate createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProgressId() { return progressId; }
    public void setProgressId(Long progressId) { this.progressId = progressId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public String getReconstruction() { return reconstruction; }
    public void setReconstruction(String reconstruction) { this.reconstruction = reconstruction; }

    public String getDiffJson() { return diffJson; }
    public void setDiffJson(String diffJson) { this.diffJson = diffJson; }

    public int getListenCount() { return listenCount; }
    public void setListenCount(int listenCount) { this.listenCount = listenCount; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
