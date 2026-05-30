package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.*;
import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.*;
import com.listeningtrainer.mapper.*;
import org.springframework.stereotype.*;

import java.util.*;
import java.util.stream.*;

@Service
public class PracticeService {

    private final LessonMapper lessonMapper;
    private final LessonSentenceMapper sentenceMapper;
    private final PracticeRecordMapper recordMapper;
    private final PracticeAnswerMapper answerMapper;
    private final UserProgressSummaryMapper summaryMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PracticeService(LessonMapper lessonMapper,
                           LessonSentenceMapper sentenceMapper,
                           PracticeRecordMapper recordMapper,
                           PracticeAnswerMapper answerMapper,
                           UserProgressSummaryMapper summaryMapper) {
        this.lessonMapper = lessonMapper;
        this.sentenceMapper = sentenceMapper;
        this.recordMapper = recordMapper;
        this.answerMapper = answerMapper;
        this.summaryMapper = summaryMapper;
    }

    /**
     * Get sentence info for practice (audio path + blanks).
     */
    public SentencePracticeInfo getSentenceInfo(Long userId, Long lessonId, int sentenceIdx) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId) || !"ready".equals(lesson.getStatus())) {
            return null;
        }

        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getLessonId, lessonId)
               .eq(LessonSentence::getSentenceIndex, sentenceIdx);
        LessonSentence ls = sentenceMapper.selectOne(wrapper);
        if (ls == null) return null;

        LambdaQueryWrapper<LessonSentence> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(LessonSentence::getLessonId, lessonId);
        int total = sentenceMapper.selectCount(countWrapper).intValue();

        SentencePracticeInfo info = new SentencePracticeInfo();
        info.setSentenceId(ls.getId());
        info.setIndex(ls.getSentenceIndex());
        info.setTotalSentences(total);
        info.setAudioPath(ls.getAudioPath());
        info.setSentenceText(ls.getText());
        try {
            info.setBlanks(objectMapper.readValue(ls.getBlanksJson(), List.class));
        } catch (Exception e) {
            info.setBlanks(Collections.emptyList());
        }
        return info;
    }

    /**
     * Submit answer for a sentence. Returns per-sentence score.
     */
    public Map<String, Object> submitSentenceAnswer(Long sentenceId, String userAnswer) {
        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getId, sentenceId);
        LessonSentence ls = sentenceMapper.selectOne(wrapper);
        if (ls == null) return Collections.emptyMap();

        List<Map<String, Object>> blanks;
        try {
            blanks = objectMapper.readValue(ls.getBlanksJson(), List.class);
        } catch (Exception e) {
            return Collections.emptyMap();
        }

        String[] userWords = userAnswer.trim().split("\\s+");
        List<Map<String, Object>> results = new ArrayList<>();
        int correct = 0;

        for (Map<String, Object> blank : blanks) {
            String expectedWord = (String) blank.get("word");
            String userWord = "";
            if (results.size() < userWords.length) {
                userWord = userWords[results.size()];
            }

            boolean isCorrect = userWord.equalsIgnoreCase(expectedWord);
            if (isCorrect) correct++;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("word", expectedWord);
            result.put("correct", isCorrect);
            result.put("userAnswer", userWord);
            results.add(result);
        }

        int sentenceScore = blanks.isEmpty() ? 100 : (int) Math.round((double) correct / blanks.size() * 100);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sentenceId", sentenceId);
        response.put("score", sentenceScore);
        response.put("blanks", results);
        return response;
    }

    /**
     * Complete practice session, save all answers and calculate total score.
     */
    public PracticeCompleteResponse completePractice(Long userId, Long lessonId,
                                                      List<Map<String, Object>> allAnswers) {
        PracticeRecord record = new PracticeRecord();
        record.setLessonId(lessonId);
        record.setUserId(userId);
        record.setListenCount(0);
        recordMapper.insert(record);

        int totalScore = 0;
        int sentenceCount = 0;

        for (Map<String, Object> answerData : allAnswers) {
            PracticeAnswer pa = new PracticeAnswer();
            pa.setRecordId(record.getId());
            pa.setSentenceId(((Number) answerData.get("sentenceId")).longValue());
            pa.setSentenceText((String) answerData.get("sentenceText"));
            pa.setUserAnswer((String) answerData.get("userAnswer"));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> blanks = (List<Map<String, Object>>) answerData.get("blanks");
            try {
                pa.setBlanksJson(objectMapper.writeValueAsString(blanks));
            } catch (Exception e) {
                pa.setBlanksJson("[]");
            }

            int s = (int) answerData.get("score");
            totalScore += s;
            sentenceCount++;

            answerMapper.insert(pa);
        }

        int avgScore = sentenceCount > 0 ? totalScore / sentenceCount : 0;
        record.setScore(avgScore);
        recordMapper.updateById(record);

        // Update user_progress summary
        LambdaQueryWrapper<UserProgressSummary> sw = new LambdaQueryWrapper<>();
        sw.eq(UserProgressSummary::getUserId, userId)
          .eq(UserProgressSummary::getLessonId, String.valueOf(lessonId));
        UserProgressSummary summary = summaryMapper.selectOne(sw);
        if (summary == null) {
            summary = new UserProgressSummary();
            summary.setUserId(userId);
            summary.setLessonId(String.valueOf(lessonId));
            summary.setLatestScore(avgScore);
            summary.setBestScore(avgScore);
            summary.setTotalAttempts(1);
            summary.setLastDate(java.time.LocalDate.now());
            summaryMapper.insert(summary);
        } else {
            summary.setLatestScore(avgScore);
            summary.setBestScore(Math.max(summary.getBestScore(), avgScore));
            summary.setTotalAttempts(summary.getTotalAttempts() + 1);
            summary.setLastDate(java.time.LocalDate.now());
            summaryMapper.updateById(summary);
        }

        return new PracticeCompleteResponse(record.getId(), avgScore);
    }

    /**
     * Get review detail with original text + user answers.
     */
    public ReviewDetailResponse getReviewDetail(Long userId, Long recordId) {
        PracticeRecord record = recordMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) return null;

        Lesson lesson = lessonMapper.selectById(record.getLessonId());
        if (lesson == null) return null;

        ReviewDetailResponse resp = new ReviewDetailResponse();
        resp.setRecordId(record.getId());
        resp.setLessonId(lesson.getId());
        resp.setLessonTitle(lesson.getTitle());
        resp.setScore(record.getScore());
        resp.setListenCount(record.getListenCount());
        resp.setCompletedAt(record.getCompletedAt());

        LambdaQueryWrapper<PracticeAnswer> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PracticeAnswer::getRecordId, recordId);
        List<PracticeAnswer> answers = answerMapper.selectList(wrapper);

        List<ReviewDetailResponse.ReviewSentenceDetail> sentenceDetails = new ArrayList<>();
        for (PracticeAnswer pa : answers) {
            ReviewDetailResponse.ReviewSentenceDetail detail = new ReviewDetailResponse.ReviewSentenceDetail();
            detail.setSentenceId(pa.getSentenceId());
            detail.setSentenceText(pa.getSentenceText());
            detail.setUserAnswer(pa.getUserAnswer());

            LambdaQueryWrapper<LessonSentence> sw = new LambdaQueryWrapper<>();
            sw.eq(LessonSentence::getId, pa.getSentenceId());
            LessonSentence ls = sentenceMapper.selectOne(sw);
            if (ls != null) detail.setAudioPath(ls.getAudioPath());

            try {
                detail.setBlanks(objectMapper.readValue(pa.getBlanksJson(), List.class));
            } catch (Exception e) {
                detail.setBlanks(Collections.emptyList());
            }
            sentenceDetails.add(detail);
        }
        resp.setSentences(sentenceDetails);
        return resp;
    }
}
