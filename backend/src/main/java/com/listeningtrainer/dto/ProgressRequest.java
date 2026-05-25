package com.listeningtrainer.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProgressRequest {

    @NotBlank
    private String lessonId;

    @NotNull @Min(0) @Max(100)
    private Integer score;

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
}
