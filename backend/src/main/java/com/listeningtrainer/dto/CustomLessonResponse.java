package com.listeningtrainer.dto;

public class CustomLessonResponse {

    private String lessonKey;
    private String title;
    private String difficulty;
    private String hint;
    private String sentence;
    private String voice;

    public CustomLessonResponse(String lessonKey, String title, String difficulty,
                                 String hint, String sentence, String voice) {
        this.lessonKey = lessonKey;
        this.title = title;
        this.difficulty = difficulty;
        this.hint = hint;
        this.sentence = sentence;
        this.voice = voice;
    }

    public String getLessonKey() { return lessonKey; }
    public String getTitle() { return title; }
    public String getDifficulty() { return difficulty; }
    public String getHint() { return hint; }
    public String getSentence() { return sentence; }
    public String getVoice() { return voice; }
}
