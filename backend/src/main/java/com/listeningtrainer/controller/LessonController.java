package com.listeningtrainer.controller;

import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.User;
import com.listeningtrainer.service.LessonService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping
    public ResponseEntity<LessonResponse> createLesson(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody LessonUploadRequest request) {
        return ResponseEntity.ok(lessonService.createDraft(user.getId(), request));
    }

    @PutMapping("/{id}/sentences")
    public ResponseEntity<LessonResponse> updateSentences(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody List<LessonSentenceEdit> edits) {
        return ResponseEntity.ok(lessonService.updateSentences(user.getId(), id, edits));
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<LessonResponse> generateAudio(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(lessonService.generateAudio(user.getId(), id));
    }

    @GetMapping
    public ResponseEntity<List<LessonResponse>> getLessons(
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(lessonService.getLessons(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonResponse> getLesson(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        LessonResponse lesson = lessonService.getLessonById(id, user.getId());
        if (lesson == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(lesson);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        lessonService.deleteLesson(user.getId(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/regenerate-blanks")
    public ResponseEntity<LessonResponse> regenerateBlanks(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(lessonService.regenerateBlanks(user.getId(), id));
    }

    @PostMapping("/{lessonId}/regenerate-blanks/{sentenceId}")
    public ResponseEntity<LessonResponse> regenerateSentenceBlanks(
            @AuthenticationPrincipal User user,
            @PathVariable Long lessonId,
            @PathVariable Long sentenceId) {
        return ResponseEntity.ok(lessonService.regenerateSentenceBlanks(user.getId(), lessonId, sentenceId));
    }
}
