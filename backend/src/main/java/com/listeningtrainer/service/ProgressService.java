package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.listeningtrainer.dto.ProgressHistoryResponse;
import com.listeningtrainer.dto.ProgressRequest;
import com.listeningtrainer.dto.ProgressResponse;
import com.listeningtrainer.entity.UserProgress;
import com.listeningtrainer.entity.UserProgressSummary;
import com.listeningtrainer.mapper.UserProgressMapper;
import com.listeningtrainer.mapper.UserProgressSummaryMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProgressService {

    private final UserProgressMapper progressMapper;
    private final UserProgressSummaryMapper summaryMapper;

    public ProgressService(UserProgressMapper progressMapper, UserProgressSummaryMapper summaryMapper) {
        this.progressMapper = progressMapper;
        this.summaryMapper = summaryMapper;
    }

    public List<ProgressResponse> getProgress(Long userId) {
        LambdaQueryWrapper<UserProgressSummary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProgressSummary::getUserId, userId);
        return summaryMapper.selectList(wrapper).stream()
                .map(s -> new ProgressResponse(
                        s.getLessonId(),
                        s.getLatestScore(),
                        s.getTotalAttempts(),
                        s.getBestScore(),
                        s.getLastDate()))
                .toList();
    }

    public List<ProgressHistoryResponse> getHistory(Long userId) {
        LambdaQueryWrapper<UserProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProgress::getUserId, userId)
               .orderByDesc(UserProgress::getDate);
        return progressMapper.selectList(wrapper).stream()
                .map(p -> new ProgressHistoryResponse(
                        p.getId(),
                        p.getLessonId(),
                        p.getScore(),
                        p.getDate()))
                .toList();
    }

    public List<ProgressHistoryResponse> getLessonHistory(Long userId, String lessonId) {
        LambdaQueryWrapper<UserProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProgress::getUserId, userId)
               .eq(UserProgress::getLessonId, lessonId)
               .orderByDesc(UserProgress::getDate);
        return progressMapper.selectList(wrapper).stream()
                .map(p -> new ProgressHistoryResponse(
                        p.getId(),
                        p.getLessonId(),
                        p.getScore(),
                        p.getDate()))
                .toList();
    }

    public ProgressResponse saveProgress(Long userId, ProgressRequest request) {
        // 1. Insert detail row
        UserProgress detail = new UserProgress(userId, request.getLessonId(), request.getScore(), LocalDate.now());
        progressMapper.insert(detail);

        // 2. Upsert summary
        LambdaQueryWrapper<UserProgressSummary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProgressSummary::getUserId, userId)
               .eq(UserProgressSummary::getLessonId, request.getLessonId());
        UserProgressSummary summary = summaryMapper.selectOne(wrapper);

        if (summary == null) {
            summary = new UserProgressSummary();
            summary.setUserId(userId);
            summary.setLessonId(request.getLessonId());
            summary.setLatestScore(request.getScore());
            summary.setBestScore(request.getScore());
            summary.setTotalAttempts(1);
            summary.setLastDate(LocalDate.now());
            summaryMapper.insert(summary);
        } else {
            summary.setLatestScore(request.getScore());
            summary.setBestScore(Math.max(summary.getBestScore(), request.getScore()));
            summary.setTotalAttempts(summary.getTotalAttempts() + 1);
            summary.setLastDate(LocalDate.now());
            summaryMapper.updateById(summary);
        }

        return new ProgressResponse(
                summary.getLessonId(),
                summary.getLatestScore(),
                summary.getTotalAttempts(),
                summary.getBestScore(),
                summary.getLastDate()
        );
    }
}
