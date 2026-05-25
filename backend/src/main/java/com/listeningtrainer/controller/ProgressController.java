package com.listeningtrainer.controller;

import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.User;
import com.listeningtrainer.service.ProgressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public ResponseEntity<?> getProgress(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(progressService.getProgress(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> saveProgress(@AuthenticationPrincipal User user,
                                          @Valid @RequestBody ProgressRequest request) {
        ProgressResponse response = progressService.saveProgress(user.getId(), request);
        return ResponseEntity.ok(response);
    }
}
