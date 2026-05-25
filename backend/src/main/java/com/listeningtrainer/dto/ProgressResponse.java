package com.listeningtrainer.dto;

import java.time.LocalDate;

public class ProgressResponse {

    private String lessonId;
    private int score;
    private int attempts;
    private int bestScore;
    private LocalDate date;

    public ProgressResponse(String lessonId, int score, int attempts, int bestScore, LocalDate date) {
        this.lessonId = lessonId;
        this.score = score;
        this.attempts = attempts;
        this.bestScore = bestScore;
        this.date = date;
    }

    public String getLessonId() { return lessonId; }
    public int getScore() { return score; }
    public int getAttempts() { return attempts; }
    public int getBestScore() { return bestScore; }
    public LocalDate getDate() { return date; }
}
