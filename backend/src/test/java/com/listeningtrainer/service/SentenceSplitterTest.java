package com.listeningtrainer.service;

import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.listeningtrainer.service.cloze.NumberPatternDetector;
import com.listeningtrainer.service.cloze.PhrasalVerbDetector;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class SentenceSplitterTest {
    // Use real WordBankService with null mapper (no DB, uses default scoring)
    private final WordBankService wordBankService = new WordBankService(null);
    private final WordBank wordBank = new WordBank(wordBankService);
    private final NumberPatternDetector numberDetector = new NumberPatternDetector();
    private final PhrasalVerbDetector phrasalVerbDetector = new PhrasalVerbDetector();
    private final SentenceSplitter splitter = new SentenceSplitter(wordBank, numberDetector, phrasalVerbDetector);
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void testNumbersAreBlanked() throws Exception {
        // "My room number is 305" — 305 should be blanked (IELTS key testing point)
        String json = splitter.splitAndTag("My room number is 305.", "paragraph");
        List<Map<String, Object>> sentences = mapper.readValue(json, List.class);
        List<Map<String, Object>> blanks = (List<Map<String, Object>>) sentences.get(0).get("blanksJson");

        boolean hasNumber = blanks.stream()
            .anyMatch(b -> "305".equals(b.get("word")));
        assertTrue(hasNumber, "Number '305' should be blanked as IELTS testing point");
    }

    @Test
    void testPhrasalVerbProtection() throws Exception {
        // "Please pick up the phone" — "pick" should be blanked, "up" should be protected
        String json = splitter.splitAndTag("Please pick up the phone.", "paragraph");
        List<Map<String, Object>> sentences = mapper.readValue(json, List.class);
        List<Map<String, Object>> blanks = (List<Map<String, Object>>) sentences.get(0).get("blanksJson");

        boolean hasPick = blanks.stream()
            .anyMatch(b -> "pick".equalsIgnoreCase((String) b.get("word")));
        boolean hasUp = blanks.stream()
            .anyMatch(b -> "up".equalsIgnoreCase((String) b.get("word")));
        
        assertTrue(hasPick, "Verb 'pick' should be blanked");
        assertFalse(hasUp, "Particle 'up' should be protected (not blanked)");
    }
}
