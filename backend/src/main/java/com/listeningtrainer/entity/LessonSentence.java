package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("lesson_sentence")
public class LessonSentence {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long lessonId;
    private Integer sentenceIndex;
    private String text;
    private String audioPath;
    private String voice;
    private String blanksJson;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public Integer getSentenceIndex() { return sentenceIndex; }
    public void setSentenceIndex(Integer sentenceIndex) { this.sentenceIndex = sentenceIndex; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
    public String getBlanksJson() { return blanksJson; }
    public void setBlanksJson(String blanksJson) { this.blanksJson = blanksJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
