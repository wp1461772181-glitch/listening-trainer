package com.listeningtrainer.dto;

public class WordBankEntryRequest {
    private String word;
    private String category;
    private String posTag;
    private Integer baseScore;
    private String notes;

    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPosTag() { return posTag; }
    public void setPosTag(String posTag) { this.posTag = posTag; }
    public Integer getBaseScore() { return baseScore; }
    public void setBaseScore(Integer baseScore) { this.baseScore = baseScore; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
