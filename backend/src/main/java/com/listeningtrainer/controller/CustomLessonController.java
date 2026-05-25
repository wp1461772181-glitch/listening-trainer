package com.listeningtrainer.controller;

import com.listeningtrainer.dto.CustomLessonRequest;
import com.listeningtrainer.dto.CustomLessonResponse;
import com.listeningtrainer.entity.User;
import com.listeningtrainer.service.CustomLessonService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/custom-lessons")
public class CustomLessonController {

    private final CustomLessonService service;

    public CustomLessonController(CustomLessonService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listByUser(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User user,
                                     @Valid @RequestBody CustomLessonRequest request) {
        CustomLessonResponse response = service.create(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{lessonKey}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal User user,
                                     @PathVariable String lessonKey) {
        service.delete(user.getId(), lessonKey);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
