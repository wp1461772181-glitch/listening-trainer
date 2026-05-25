package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.listeningtrainer.dto.ProgressRequest;
import com.listeningtrainer.dto.ProgressResponse;
import com.listeningtrainer.entity.UserProgress;
import com.listeningtrainer.mapper.UserProgressMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProgressService {

    private final UserProgressMapper progressMapper;

    public ProgressService(UserProgressMapper progressMapper) {
        this.progressMapper = progressMapper;
    }

    public List<ProgressResponse> getProgress(Long userId) {
        LambdaQueryWrapper<UserProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProgress::getUserId, userId);
        return progressMapper.selectList(wrapper).stream()
                .map(p -> new ProgressResponse(p.getLessonId(), p.getScore(), p.getAttempts(), p.getBestScore(), p.getDate()))
                .toList();
    }

    public ProgressResponse saveProgress(Long userId, ProgressRequest request) {
        LambdaQueryWrapper<UserProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProgress::getUserId, userId)
               .eq(UserProgress::getLessonId, request.getLessonId());
        UserProgress existing = progressMapper.selectOne(wrapper);

        int newAttempts = (existing != null ? existing.getAttempts() : 0) + 1;
        int newBestScore = Math.max(request.getScore(), existing != null ? existing.getBestScore() : 0);

        UserProgress progress;
        if (existing != null) {
            progress = existing;
        } else {
            progress = new UserProgress();
            progress.setUserId(userId);
            progress.setLessonId(request.getLessonId());
        }
        progress.setScore(request.getScore());
        progress.setAttempts(newAttempts);
        progress.setBestScore(newBestScore);
        progress.setDate(LocalDate.now());

        if (existing != null) {
            progressMapper.updateById(progress);
        } else {
            progressMapper.insert(progress);
        }

        return new ProgressResponse(
                progress.getLessonId(),
                progress.getScore(),
                progress.getAttempts(),
                progress.getBestScore(),
                progress.getDate()
        );
    }
}
