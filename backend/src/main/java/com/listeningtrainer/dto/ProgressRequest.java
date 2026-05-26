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

    private String keywords;
    private String reconstruction;
    private String diffJson;
    private Integer listenCount;

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public String getReconstruction() { return reconstruction; }
    public void setReconstruction(String reconstruction) { this.reconstruction = reconstruction; }

    public String getDiffJson() { return diffJson; }
    public void setDiffJson(String diffJson) { this.diffJson = diffJson; }

    public Integer getListenCount() { return listenCount; }
    public void setListenCount(Integer listenCount) { this.listenCount = listenCount; }
}
