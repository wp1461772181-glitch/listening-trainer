package com.listeningtrainer.dto;

public class PracticeCompleteResponse {

    private Long recordId;
    private int score;

    public PracticeCompleteResponse(Long recordId, int score) {
        this.recordId = recordId;
        this.score = score;
    }

    public Long getRecordId() { return recordId; }
    public int getScore() { return score; }
}
