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
    void testNNPNotBlanked() throws Exception {
        // "I live in London" — London (NNP) should NOT be blanked
        String json = splitter.splitAndTag("I live in London.", "paragraph");
        List<Map<String, Object>> sentences = mapper.readValue(json, List.class);
        List<Map<String, Object>> blanks = (List<Map<String, Object>>) sentences.get(0).get("blanksJson");

        for (Map<String, Object> blank : blanks) {
            String word = (String) blank.get("word");
            assertNotEquals("London", word, "Proper noun 'London' should not be blanked");
        }
    }

    @Test
    void testMultipleNNPNotBlanked() throws Exception {
        // "John met Mary in Paris" — John, Mary, Paris (NNP) should NOT be blanked
        String json = splitter.splitAndTag("John met Mary in Paris.", "paragraph");
        List<Map<String, Object>> sentences = mapper.readValue(json, List.class);
        List<Map<String, Object>> blanks = (List<Map<String, Object>>) sentences.get(0).get("blanksJson");

        for (Map<String, Object> blank : blanks) {
            String word = (String) blank.get("word");
            assertNotEquals("John", word);
            assertNotEquals("Mary", word);
            assertNotEquals("Paris", word);
        }
    }

    @Test
    void testDifficultyEasy() throws Exception {
        // Easy mode should blank fewer words (only Tier 0-1)
        String text = "The library is very convenient and comfortable.";
        String jsonEasy = splitter.splitAndTag(text, "paragraph", "easy");
        String jsonHard = splitter.splitAndTag(text, "paragraph", "hard");

        List<Map<String, Object>> sentEasy = mapper.readValue(jsonEasy, List.class);
        List<Map<String, Object>> sentHard = mapper.readValue(jsonHard, List.class);

        List<Map<String, Object>> blanksEasy = (List<Map<String, Object>>) sentEasy.get(0).get("blanksJson");
        List<Map<String, Object>> blanksHard = (List<Map<String, Object>>) sentHard.get(0).get("blanksJson");

        // Hard should have more blanks than easy (or equal if sentence is too short)
        assertTrue(blanksHard.size() >= blanksEasy.size(),
            "Hard mode should blank at least as many words as easy");
    }

    @Test
    void testDifficultyHard() throws Exception {
        // Hard mode should allow up to 3 blanks per sentence
        String text = "The important lecture was extremely convenient for the students.";
        String json = splitter.splitAndTag(text, "paragraph", "hard");
        List<Map<String, Object>> sentences = mapper.readValue(json, List.class);
        List<Map<String, Object>> blanks = (List<Map<String, Object>>) sentences.get(0).get("blanksJson");

        // Hard mode allows up to 3 blanks (vs 2 in medium)
        assertTrue(blanks.size() <= 3, "Hard mode allows up to 3 blanks per sentence");
    }
}
