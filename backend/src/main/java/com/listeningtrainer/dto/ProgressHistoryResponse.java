package com.listeningtrainer.dto;

import java.time.LocalDate;

public class ProgressHistoryResponse {

    private Long id;
    private String lessonId;
    private int score;
    private LocalDate date;

    public ProgressHistoryResponse(Long id, String lessonId, int score, LocalDate date) {
        this.id = id;
        this.lessonId = lessonId;
        this.score = score;
        this.date = date;
    }

    public Long getId() { return id; }
    public String getLessonId() { return lessonId; }
    public int getScore() { return score; }
    public LocalDate getDate() { return date; }
}
