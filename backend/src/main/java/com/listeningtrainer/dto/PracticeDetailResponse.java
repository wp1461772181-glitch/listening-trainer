package com.listeningtrainer.dto;

import java.time.LocalDate;

public class PracticeDetailResponse {

    private Long id;
    private Long progressId;
    private String lessonId;
    private String keywords;
    private String reconstruction;
    private String diffJson;
    private int listenCount;
    private int score;
    private LocalDate createdAt;

    public PracticeDetailResponse(Long id, Long progressId, String lessonId,
                                   String keywords, String reconstruction,
                                   String diffJson, int listenCount,
                                   int score, LocalDate createdAt) {
        this.id = id;
        this.progressId = progressId;
        this.lessonId = lessonId;
        this.keywords = keywords;
        this.reconstruction = reconstruction;
        this.diffJson = diffJson;
        this.listenCount = listenCount;
        this.score = score;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getProgressId() { return progressId; }
    public String getLessonId() { return lessonId; }
    public String getKeywords() { return keywords; }
    public String getReconstruction() { return reconstruction; }
    public String getDiffJson() { return diffJson; }
    public int getListenCount() { return listenCount; }
    public int getScore() { return score; }
    public LocalDate getCreatedAt() { return createdAt; }
}
