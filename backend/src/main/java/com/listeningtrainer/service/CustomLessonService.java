package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.listeningtrainer.dto.CustomLessonRequest;
import com.listeningtrainer.dto.CustomLessonResponse;
import com.listeningtrainer.entity.CustomLesson;
import com.listeningtrainer.mapper.CustomLessonMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CustomLessonService {

    private final CustomLessonMapper mapper;

    public CustomLessonService(CustomLessonMapper mapper) {
        this.mapper = mapper;
    }

    public List<CustomLessonResponse> listByUser(Long userId) {
        LambdaQueryWrapper<CustomLesson> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CustomLesson::getUserId, userId)
               .orderByDesc(CustomLesson::getCreatedAt);
        return mapper.selectList(wrapper).stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomLessonResponse create(Long userId, CustomLessonRequest request) {
        CustomLesson lesson = new CustomLesson();
        lesson.setUserId(userId);
        lesson.setLessonKey("custom-" + UUID.randomUUID().toString().substring(0, 8));
        lesson.setTitle(request.getTitle());
        lesson.setDifficulty(request.getDifficulty());
        lesson.setHint(request.getHint());
        lesson.setSentence(request.getSentence());
        lesson.setVoice(request.getVoice() != null ? request.getVoice() : "female");
        mapper.insert(lesson);
        return toResponse(lesson);
    }

    public void delete(Long userId, String lessonKey) {
        LambdaQueryWrapper<CustomLesson> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CustomLesson::getUserId, userId)
               .eq(CustomLesson::getLessonKey, lessonKey);
        mapper.delete(wrapper);
    }

    private CustomLessonResponse toResponse(CustomLesson l) {
        return new CustomLessonResponse(
                l.getLessonKey(), l.getTitle(), l.getDifficulty(),
                l.getHint(), l.getSentence(), l.getVoice()
        );
    }
}
