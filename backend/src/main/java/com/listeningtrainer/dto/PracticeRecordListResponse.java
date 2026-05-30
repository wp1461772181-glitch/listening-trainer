package com.listeningtrainer.dto;

import java.time.LocalDateTime;

public class PracticeRecordListResponse {

    private Long recordId;
    private Long lessonId;
    private String lessonTitle;
    private String difficulty;
    private int score;
    private int listenCount;
    private LocalDateTime completedAt;
    private int sentenceCount;

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getLessonTitle() { return lessonTitle; }
    public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getListenCount() { return listenCount; }
    public void setListenCount(int listenCount) { this.listenCount = listenCount; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public int getSentenceCount() { return sentenceCount; }
    public void setSentenceCount(int sentenceCount) { this.sentenceCount = sentenceCount; }
}
