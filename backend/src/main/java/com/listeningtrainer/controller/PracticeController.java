package com.listeningtrainer.controller;

import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.User;
import com.listeningtrainer.service.PracticeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lessons/{lessonId}/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @GetMapping
    public ResponseEntity<SentencePracticeInfo> getSentence(
            @AuthenticationPrincipal User user,
            @PathVariable Long lessonId,
            @RequestParam(defaultValue = "0") int sentenceIdx) {
        SentencePracticeInfo info = practiceService.getSentenceInfo(user.getId(), lessonId, sentenceIdx);
        if (info == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(info);
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @AuthenticationPrincipal User user,
            @PathVariable Long lessonId,
            @Valid @RequestBody PracticeSubmitRequest request) {
        return ResponseEntity.ok(practiceService.submitSentenceAnswer(
                request.getSentenceId(), request.getUserAnswer()));
    }

    @PostMapping("/complete")
    public ResponseEntity<PracticeCompleteResponse> complete(
            @AuthenticationPrincipal User user,
            @PathVariable Long lessonId,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> answers =
            (List<Map<String, Object>>) body.get("answers");
        PracticeCompleteResponse resp = practiceService.completePractice(
                user.getId(), lessonId, answers);
        return ResponseEntity.ok(resp);
    }

    /**
     * List all practice records for current user.
     */
    @GetMapping("/records")
    public ResponseEntity<List<PracticeRecordListResponse>> listRecords(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(practiceService.listPracticeRecords(user.getId()));
    }
}
