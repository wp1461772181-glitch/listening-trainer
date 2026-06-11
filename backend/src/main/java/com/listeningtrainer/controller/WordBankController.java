package com.listeningtrainer.controller;

import com.listeningtrainer.dto.WordBankEntryDTO;
import com.listeningtrainer.dto.WordBankEntryRequest;
import com.listeningtrainer.service.WordBankService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/word-bank")
public class WordBankController {

    private final WordBankService wordBankService;

    public WordBankController(WordBankService wordBankService) {
        this.wordBankService = wordBankService;
    }

    @GetMapping
    public ResponseEntity<List<WordBankEntryDTO>> listEntries(
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "0") int offset,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        return ResponseEntity.ok(wordBankService.listEntries(category, search, offset, limit));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(wordBankService.getStats());
    }

    @PostMapping
    public ResponseEntity<WordBankEntryDTO> createEntry(@RequestBody WordBankEntryRequest req) {
        return ResponseEntity.ok(wordBankService.createEntry(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WordBankEntryDTO> updateEntry(
            @PathVariable Long id, @RequestBody WordBankEntryRequest req) {
        WordBankEntryDTO result = wordBankService.updateEntry(id, req);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        if (!wordBankService.deleteEntry(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch-delete")
    public ResponseEntity<Map<String, Integer>> batchDelete(@RequestBody Map<String, List<Long>> body) {
        int count = wordBankService.batchDelete(body.get("ids"));
        return ResponseEntity.ok(Map.of("deleted", count));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh() {
        wordBankService.refreshFromDb();
        return ResponseEntity.ok(Map.of("status", "refreshed"));
    }

    @GetMapping("/score")
    public ResponseEntity<Map<String, Object>> scoreWord(
            @RequestParam String word,
            @RequestParam(required = false, defaultValue = "") String pos) {
        int score = wordBankService.scoreWord(word, pos);
        String category = "unknown";
        if (score == 0) category = "blacklist";
        else if (score >= 100) category = "core";
        else category = "pos_default";
        return ResponseEntity.ok(Map.of(
            "word", word,
            "posTag", pos,
            "score", score,
            "category", category
        ));
    }
}
