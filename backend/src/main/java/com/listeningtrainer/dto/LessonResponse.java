package com.listeningtrainer.dto;

import java.time.LocalDateTime;
import java.util.*;

public class LessonResponse {

    private Long id;
    private String title;
    private String difficulty;
    private String hint;
    private String status;
    private LocalDateTime createdAt;
    private List<LessonSentenceResponse> sentences;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<LessonSentenceResponse> getSentences() { return sentences; }
    public void setSentences(List<LessonSentenceResponse> sentences) { this.sentences = sentences; }
}
