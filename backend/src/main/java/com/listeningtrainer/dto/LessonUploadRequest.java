package com.listeningtrainer.dto;

import jakarta.validation.constraints.*;

public class LessonUploadRequest {

    @NotBlank private String title;
    @NotBlank private String difficulty;
    private String hint;
    @NotBlank private String text;
    private String voice;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
}
