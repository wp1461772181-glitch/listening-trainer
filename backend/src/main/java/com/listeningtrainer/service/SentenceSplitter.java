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
     * Words to always skip — conversational filler or trivial content words.
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

    /** Max blanks per sentence — keeps focus on vocabulary, not every noun. */
    private static final int MAX_BLANKS_PER_SENTENCE = 1;

    /** Global max blanks per text section — prevents overwhelming the learner. */
    private static final int GLOBAL_MAX_BLANKS = 12;

    /**
     * Assign a priority tier to a candidate word.
     * Lower tier = higher priority (picked first).
     *
     * Tier 0: DB core vocabulary (score >= 100) — IELTS key words
     * Tier 1: Adjectives/Adverbs >= 6 chars (JJ/RB, score >= 10) — descriptive words
     * Tier 2: Other (common nouns, verbs, short words) — not selected
     *
     * Common nouns (NN/NNP) are excluded from tiered selection because they all
     * score the same (15) — there's no way to distinguish "important" nouns
     * from everyday ones without explicit DB entries.
     */
    private int computeTier(String word, String pos, int score) {
        if (score >= 100) return 0; // DB core vocabulary
        if ((pos.startsWith("JJ") || pos.startsWith("RB")) && word.length() >= 6 && score >= 10) return 1;
        return 2;
    }

    /**
     * Generate blanks from text using a tiered word-bank scoring system.
     *
     * Strategy:
     *   1. Filter out blacklisted words, short words, trivial words
     *   2. Assign each candidate a priority tier (see computeTier)
     *   3. Per sentence: pick the highest-tiered word as the blank (max 1 per sentence)
     *
     * Global blank cap (max 12) is enforced at the LessonService level, not here,
     * because this method may be called per-sentence during regeneration.
     *
     * Sentences with no qualifying words return empty blanks —
     * the player auto-skips them, showing original text + auto-advance.
     */
    private List<Map<String, Object>> generateBlanks(String text, int offsetAdjustment, boolean isDialogue) {
        CoreDocument doc = new CoreDocument(text);
        pipeline.annotate(doc);

        // Collect candidates grouped by sentence
        List<List<Candidate>> sentenceCandidates = new ArrayList<>();

        for (CoreSentence sentence : doc.sentences()) {
            List<CoreLabel> tokens = sentence.tokens();
            List<Candidate> sentCandidates = new ArrayList<>();
            int sentWordIdx = 0;

            for (CoreLabel token : tokens) {
                String pos = token.tag();
                String word = token.word();
                if (word.length() <= 2) {
                    sentWordIdx++;
                    continue;
                }

                if (SKIP_WORDS.contains(word.toLowerCase())) {
                    sentWordIdx++;
                    continue;
                }

                int score = wordBank.scoreWord(word, pos);
                int tier = computeTier(word, pos, score);

                if (tier <= 1) {
                    sentCandidates.add(new Candidate(
                        word, token.beginPosition() + offsetAdjustment, word.length(),
                        sentWordIdx, score, tier
                    ));
                }
                sentWordIdx++;
            }

            // Sort by (tier asc, score desc, position asc)
            sentCandidates.sort((a, b) -> {
                if (a.tier != b.tier) return Integer.compare(a.tier, b.tier);
                if (a.score != b.score) return Integer.compare(b.score, a.score);
                return Integer.compare(a.position, b.position);
            });

            sentenceCandidates.add(sentCandidates);
        }

        // Pick best candidate per sentence (max 1)
        List<Map<String, Object>> blanks = new ArrayList<>();
        for (List<Candidate> sentCandidates : sentenceCandidates) {
            if (sentCandidates.isEmpty()) continue;
            blanks.add(sentCandidates.get(0).toMap());
        }

        blanks.sort(Comparator.comparingInt(m -> (Integer) m.get("position")));
        return blanks;
    }

    /** Candidate word with tier-based priority. */
    private static class Candidate {
        final String word;
        final int position;
        final int length;
        final int wordIndex;  // index within the sentence
        final int score;
        final int tier;       // 0 = best, 3 = not selectable

        Candidate(String word, int position, int length, int wordIndex, int score, int tier) {
            this.word = word;
            this.position = position;
            this.length = length;
            this.wordIndex = wordIndex;
            this.score = score;
            this.tier = tier;
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
