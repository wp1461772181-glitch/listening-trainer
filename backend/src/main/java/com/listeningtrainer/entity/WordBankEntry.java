package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.Instant;

@TableName("word_bank_entry")
public class WordBankEntry {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String word;
    private String category;
    private String posTag;
    private Integer baseScore;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

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
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
