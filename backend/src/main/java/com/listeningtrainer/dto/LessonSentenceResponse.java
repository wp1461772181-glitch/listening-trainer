package com.listeningtrainer.dto;

import java.util.*;

public class LessonSentenceResponse {

    private Long id;
    private Integer index;
    private String text;
    private String audioPath;
    private String voice;
    private List<Map<String, Object>> blanks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getIndex() { return index; }
    public void setIndex(Integer index) { this.index = index; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
    public List<Map<String, Object>> getBlanks() { return blanks; }
    public void setBlanks(List<Map<String, Object>> blanks) { this.blanks = blanks; }
}
