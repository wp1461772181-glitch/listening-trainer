package com.listeningtrainer.dto;

import java.util.*;

public class SentencePracticeInfo {

    private Long sentenceId;
    private Integer index;
    private Integer totalSentences;
    private String audioPath;
    private List<Map<String, Object>> blanks;

    public Long getSentenceId() { return sentenceId; }
    public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
    public Integer getIndex() { return index; }
    public void setIndex(Integer index) { this.index = index; }
    public Integer getTotalSentences() { return totalSentences; }
    public void setTotalSentences(Integer totalSentences) { this.totalSentences = totalSentences; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public List<Map<String, Object>> getBlanks() { return blanks; }
    public void setBlanks(List<Map<String, Object>> blanks) { this.blanks = blanks; }
}
