package com.listeningtrainer.dto;

import jakarta.validation.constraints.*;

public class PracticeSubmitRequest {

    @NotNull private Long sentenceId;
    @NotBlank private String userAnswer;

    public Long getSentenceId() { return sentenceId; }
    public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
}
