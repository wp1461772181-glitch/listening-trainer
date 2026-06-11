package com.listeningtrainer.dto;

import jakarta.validation.constraints.*;
import java.util.*;

public class LessonSentenceEdit {

    @NotNull private Integer index;
    @NotBlank private String text;
    private List<Map<String, Object>> blanksJson;

    public Integer getIndex() { return index; }
    public void setIndex(Integer index) { this.index = index; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public List<Map<String, Object>> getBlanksJson() { return blanksJson; }
    public void setBlanksJson(List<Map<String, Object>> blanksJson) { this.blanksJson = blanksJson; }
}
