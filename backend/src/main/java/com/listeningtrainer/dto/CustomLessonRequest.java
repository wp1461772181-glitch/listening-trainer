package com.listeningtrainer.dto;

import jakarta.validation.constraints.NotBlank;

public class CustomLessonRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String difficulty;

    @NotBlank
    private String sentence;

    private String hint = "";

    private String voice = "female";

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getSentence() { return sentence; }
    public void setSentence(String sentence) { this.sentence = sentence; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }

    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
}
