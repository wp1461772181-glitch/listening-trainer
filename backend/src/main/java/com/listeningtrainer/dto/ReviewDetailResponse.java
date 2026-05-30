package com.listeningtrainer.dto;

import java.time.Instant;
import java.util.*;

public class ReviewDetailResponse {

    private Long recordId;
    private Long lessonId;
    private String lessonTitle;
    private int score;
    private int listenCount;
    private Instant completedAt;
    private List<ReviewSentenceDetail> sentences;

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getLessonTitle() { return lessonTitle; }
    public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getListenCount() { return listenCount; }
    public void setListenCount(int listenCount) { this.listenCount = listenCount; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public List<ReviewSentenceDetail> getSentences() { return sentences; }
    public void setSentences(List<ReviewSentenceDetail> sentences) { this.sentences = sentences; }

    public static class ReviewSentenceDetail {
        private Long sentenceId;
        private String sentenceText;
        private String audioPath;
        private String userAnswer;
        private List<Map<String, Object>> blanks;

        public Long getSentenceId() { return sentenceId; }
        public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
        public String getSentenceText() { return sentenceText; }
        public void setSentenceText(String sentenceText) { this.sentenceText = sentenceText; }
        public String getAudioPath() { return audioPath; }
        public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
        public String getUserAnswer() { return userAnswer; }
        public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
        public List<Map<String, Object>> getBlanks() { return blanks; }
        public void setBlanks(List<Map<String, Object>> blanks) { this.blanks = blanks; }
    }
}
