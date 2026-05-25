package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("custom_lessons")
public class CustomLesson {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String lessonKey;

    private String title;

    private String difficulty;

    private String hint;

    private String sentence;

    private String voice;

    private LocalDateTime createdAt;

    public CustomLesson() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getLessonKey() { return lessonKey; }
    public void setLessonKey(String lessonKey) { this.lessonKey = lessonKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }

    public String getSentence() { return sentence; }
    public void setSentence(String sentence) { this.sentence = sentence; }

    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
