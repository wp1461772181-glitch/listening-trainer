package com.listeningtrainer.service;

import edu.stanford.nlp.ling.*;
import edu.stanford.nlp.pipeline.*;
import edu.stanford.nlp.util.*;
import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.*;

import java.util.*;
import java.util.regex.*;
import java.util.stream.*;

@Service
public class SentenceSplitter {

    private static final StanfordCoreNLP pipeline;
    private static final ObjectMapper mapper = new ObjectMapper();

    private final WordBank wordBank;

    public SentenceSplitter(WordBank wordBank) {
        this.wordBank = wordBank;
    }

    // Matches speaker prefix like "Customer:", "Barista:", "Speaker 1:", "A:", "B:"
    private static final Pattern SPEAKER_PATTERN = Pattern.compile(
        "^([A-Za-z][A-Za-z\\s]{0,15}?):\\s*"
    );

    static {
        Properties props = new Properties();
        props.setProperty("annotators", "tokenize,ssplit,pos");
        props.setProperty("tokenize.language", "en");
        pipeline = new StanfordCoreNLP(props);
    }

    /**
     * Split text into sentences and generate blanks for each.
     * Dialogue mode: split by newlines, each line = one sentence (no period splitting).
     * Paragraph mode: use CoreNLP sentence splitter (split by periods).
     */
    public String splitAndTag(String text, String mode) {
        boolean isDialogue = "dialogue".equalsIgnoreCase(mode);

        List<Map<String, Object>> sentences = new ArrayList<>();
        int idx = 0;
        String currentSpeaker = null;

        if (isDialogue) {
            // Dialogue mode: split by newlines, each line is one sentence
            String[] lines = text.split("\\n");
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                String speaker = null;
                String ttsText = trimmed;
                int speakerPrefixLength = 0;

                Matcher m = SPEAKER_PATTERN.matcher(trimmed);
                if (m.find()) {
                    currentSpeaker = m.group(1).trim();
                    speaker = currentSpeaker.toLowerCase();
                    ttsText = trimmed.substring(m.end()).trim();
                    speakerPrefixLength = m.end();
                }

                List<Map<String, Object>> blanks = generateBlanks(ttsText, speakerPrefixLength, isDialogue);

                if (blanks.size() > 6) {
                    blanks = blanks.subList(0, 6);
                }

                Map<String, Object> sentenceObj = new LinkedHashMap<>();
                sentenceObj.put("index", idx);
                sentenceObj.put("text", trimmed);
                sentenceObj.put("ttsText", ttsText);
                sentenceObj.put("speaker", speaker);
                sentenceObj.put("blanksJson", blanks);

                sentences.add(sentenceObj);
                idx++;
            }
        } else {
            // Paragraph mode: use CoreNLP sentence splitter
            CoreDocument doc = new CoreDocument(text);
            pipeline.annotate(doc);

            for (CoreSentence sentence : doc.sentences()) {
                String sentenceText = sentence.text().trim();
                if (sentenceText.isEmpty()) continue;

                List<Map<String, Object>> blanks = generateBlanks(sentenceText, 0, false);

                if (blanks.size() > 6) {
                    blanks = blanks.subList(0, 6);
                }

                Map<String, Object> sentenceObj = new LinkedHashMap<>();
                sentenceObj.put("index", idx);
                sentenceObj.put("text", sentenceText);
                sentenceObj.put("ttsText", sentenceText);
                sentenceObj.put("speaker", null);
                sentenceObj.put("blanksJson", blanks);

                sentences.add(sentenceObj);
                idx++;
            }
        }

        try {
            return mapper.writeValueAsString(sentences);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize sentences", e);
        }
    }

    /**
     * Generate blanks from text using a word-bank scoring system.
     * Candidates are scored by WordBank, then greedily selected with
     * a minimum spacing of 3 words between any two blanks.
     *
     * Blank count limits:
     *   <= 3 words:  0 blanks
     *   4-7 words:   1 blank
     *   8-15 words:  1-2 blanks
     *   16-25 words: up to 3 blanks
     *   > 25 words:  up to 4 blanks
     */
    private List<Map<String, Object>> generateBlanks(String text, int offsetAdjustment, boolean isDialogue) {
        CoreDocument doc = new CoreDocument(text);
        pipeline.annotate(doc);

        // Collect all candidates with their word index
        List<Candidate> candidates = new ArrayList<>();
        int totalWordCount = 0;
        // Track word index per sentence offset
        int globalWordIdx = 0;

        for (CoreSentence sentence : doc.sentences()) {
            List<CoreLabel> tokens = sentence.tokens();
            for (CoreLabel token : tokens) {
                String pos = token.tag();
                String word = token.word();
                if (word.length() <= 2) {
                    totalWordCount++;
                    globalWordIdx++;
                    continue;
                }

                int score = wordBank.scoreWord(word, pos);
                if (score > 0) { // skip blacklisted (score==0)
                    candidates.add(new Candidate(
                        word, token.beginPosition() + offsetAdjustment, word.length(),
                        globalWordIdx, score
                    ));
                }
                totalWordCount++;
                globalWordIdx++;
            }
        }

        // Determine max blanks based on total word count
        int maxBlanks;
        if (totalWordCount <= 3) {
            maxBlanks = 0;
        } else if (totalWordCount <= 7) {
            maxBlanks = 1;
        } else if (totalWordCount <= 15) {
            maxBlanks = 2;
        } else if (totalWordCount <= 25) {
            maxBlanks = 3;
        } else {
            maxBlanks = 4;
        }

        if (candidates.isEmpty() || maxBlanks <= 0) {
            return new ArrayList<>();
        }

        // Greedy selection with spacing constraint (min 3 words gap)
        List<Map<String, Object>> blanks = new ArrayList<>();
        Set<Integer> blockedIndices = new HashSet<>();

        for (int round = 0; round < maxBlanks && blanks.size() < candidates.size(); round++) {
            // Find highest-score candidate not blocked
            Candidate best = null;
            for (Candidate c : candidates) {
                if (!blockedIndices.contains(c.wordIndex) && (best == null || c.score > best.score || (c.score == best.score && c.position < best.position))) {
                    best = c;
                }
            }
            if (best == null) break;

            blanks.add(best.toMap());

            // Block candidates within ±3 words of the selected one
            for (Candidate c : candidates) {
                if (Math.abs(c.wordIndex - best.wordIndex) <= 3) {
                    blockedIndices.add(c.wordIndex);
                }
            }
        }

        // Sort blanks by position (for correct rendering in frontend)
        blanks.sort(Comparator.comparingInt(m -> (Integer) m.get("position")));

        return blanks;
    }

    /** Candidate word with scoring. */
    private static class Candidate {
        final String word;
        final int position;
        final int length;
        final int wordIndex;
        final int score;

        Candidate(String word, int position, int length, int wordIndex, int score) {
            this.word = word;
            this.position = position;
            this.length = length;
            this.wordIndex = wordIndex;
            this.score = score;
        }

        Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("word", word);
            m.put("position", position);
            m.put("length", length);
            return m;
        }
    }

    /**
     * Backward-compatible method.
     */
    public String splitAndTag(String text) {
        return splitAndTag(text, "paragraph");
    }

    /**
     * Generate blanks for a single sentence text using current word bank.
     * Used by regenerate-blanks feature.
     * @param offsetAdjustment offset to add to blank positions (e.g. speaker prefix length)
     */
    public List<Map<String, Object>> generateBlanksForSentence(String text, int offsetAdjustment) {
        return generateBlanks(text, offsetAdjustment, false);
    }
}
