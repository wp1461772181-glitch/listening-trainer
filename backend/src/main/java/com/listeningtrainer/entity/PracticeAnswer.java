package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;

@TableName("practice_answer")
public class PracticeAnswer {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long recordId;
    private Long sentenceId;
    private String sentenceText;
    private String userAnswer;
    private String blanksJson;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public Long getSentenceId() { return sentenceId; }
    public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
    public String getSentenceText() { return sentenceText; }
    public void setSentenceText(String sentenceText) { this.sentenceText = sentenceText; }
    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
    public String getBlanksJson() { return blanksJson; }
    public void setBlanksJson(String blanksJson) { this.blanksJson = blanksJson; }
}
