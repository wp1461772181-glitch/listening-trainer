package com.listeningtrainer.dto;

import java.time.Instant;

public class WordBankEntryDTO {
    private Long id;
    private String word;
    private String category;
    private String posTag;
    private Integer baseScore;
    private String notes;
    private Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static WordBankEntryDTO fromEntity(com.listeningtrainer.entity.WordBankEntry e) {
        WordBankEntryDTO dto = new WordBankEntryDTO();
        dto.setId(e.getId());
        dto.setWord(e.getWord());
        dto.setCategory(e.getCategory());
        dto.setPosTag(e.getPosTag());
        dto.setBaseScore(e.getBaseScore());
        dto.setNotes(e.getNotes());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }
}
