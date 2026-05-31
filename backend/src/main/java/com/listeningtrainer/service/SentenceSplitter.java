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
     * Minimum score for a word to be eligible as a blank.
     * Only words in the DB-backed "core" vocabulary list (score=100) or
     * words with explicit high scores qualify. Common nouns (NN=15),
     * proper nouns (NNP=20), adjectives (JJ=10) are all filtered out.
     * This ensures blanks test actual IELTS vocabulary, not everyday words.
     */
    private static final int MIN_BLANK_SCORE = 50;

    /**
     * Words to always skip even if they pass score threshold.
     * These are conversational filler or trivial content words.
     */
    private static final Set<String> SKIP_WORDS = Set.of(
        // Common names used in dialogues
        "carol","kate","smith","john","mary","peter","sarah","mike","tom","linda",
        // Numbers (IELTS listening tests spelling of numbers separately)
        "one","two","three","four","five","six","seven","eight","nine","ten",
        "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen",
        "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety",
        "hundred","thousand","million","first","second","third","fourth","fifth",
        // Trivial content
        "yes","no","right","fine","okay","ok","sure","please","thanks","thank",
        "hello","hi","goodbye","bye","sorry","welcome","excuse"
    );

    /**
     * Generate blanks from text using a word-bank scoring system.
     * Candidates are scored by WordBank, then greedily selected with
     * a minimum spacing of 3 words between any two blanks.
     *
     * A sentence is only blanked if it contains words scoring >= MIN_BLANK_SCORE.
     * Trivial/conversational sentences (no qualifying words) are left unblanked
     * and will auto-skip during playback.
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

                // Skip trivial words regardless of POS score
                if (SKIP_WORDS.contains(word.toLowerCase())) {
                    totalWordCount++;
                    globalWordIdx++;
                    continue;
                }

                int score = wordBank.scoreWord(word, pos);

                // Only consider words above the minimum blank score threshold
                if (score >= MIN_BLANK_SCORE) {
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

        // No qualifying candidates = no blanks (sentence will auto-skip in player)
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

            // Block candidates within +/-3 words of the selected one
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
