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
        "jenny","david","emma","james","susan","robert","anna","william","lisa","richard",
        "jennifer","daniel","patricia","michael","elizabeth","williams","brown","jones","miller","wilson",
        "ball","allen","young","king","wright","scott","hill","green","adams","baker",
        // Numbers (IELTS listening tests spelling of numbers separately)
        "one","two","three","four","five","six","seven","eight","nine","ten",
        "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen",
        "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety",
        "hundred","thousand","million","first","second","third","fourth","fifth",
        // Trivial content
        "yes","no","right","fine","okay","ok","sure","please","thanks","thank",
        "hello","hi","goodbye","bye","sorry","welcome","excuse",
        // Daily life — too common to be meaningful blanks
        "morning","evening","afternoon","night","today","tomorrow","yesterday","tonight",
        "breakfast","lunch","dinner","supper","snack",
        "people","thing","place","time","day","week","month","year"
    );

    /** Max blanks per sentence. */
    private static final int MAX_BLANKS_PER_SENTENCE = 2;

    /**
     * Compute a priority tier for a candidate word.
     * Lower tier = higher priority.
     *
     * Tier 0: DB core vocabulary (score >= 100) — IELTS key words
     * Tier 1: Nouns >=4 chars (NN/NNS/NNP/NNPS, score >= 15) — content nouns
     * Tier 2: Adjectives/Adverbs >=4 chars (JJ/RB, score >= 7) — descriptive words
     * Tier 3: Verbs >=5 chars (VB*, score >= 5) — action words
     * Tier 4: Fallback — any word with score > 0 (used when sentence has no higher-tier words)
     */
    public static int computeTier(String word, String pos, int score) {
        if (score >= 100) return 0;
        if ((pos.startsWith("NN")) && word.length() >= 4) return 1;
        if ((pos.startsWith("JJ") || pos.startsWith("RB")) && word.length() >= 4 && score >= 7) return 2;
        if (pos.startsWith("VB") && word.length() >= 5 && score >= 5) return 3;
        return score > 0 ? 4 : 99; // tier 4 = fallback, 99 = skip entirely
    }

    /**
     * Generate blanks from text using a tiered word-bank scoring system.
     *
     * Strategy:
     *   1. Filter out blacklisted words, short words, trivial words
     *   2. Assign each candidate a priority tier (see computeTier)
     *   3. Per sentence: pick up to MAX_BLANKS_PER_SENTENCE highest-tiered words
     *   4. Skip sentences with too few content words (trivial/greeting sentences)
     *
     * Global blank cap is enforced at the LessonService level, not here.
     */
    private List<Map<String, Object>> generateBlanks(String text, int offsetAdjustment, boolean isDialogue) {
        CoreDocument doc = new CoreDocument(text);
        pipeline.annotate(doc);

        List<Map<String, Object>> blanks = new ArrayList<>();

        for (CoreSentence sentence : doc.sentences()) {
            List<CoreLabel> tokens = sentence.tokens();
            List<Candidate> sentCandidates = new ArrayList<>();
            int contentWordCount = 0;
            int sentWordIdx = 0;

            for (CoreLabel token : tokens) {
                String pos = token.tag();
                String word = token.word();
                if (word.length() <= 2) {
                    sentWordIdx++;
                    continue;
                }

                String lowerWord = word.toLowerCase();
                if (SKIP_WORDS.contains(lowerWord)) {
                    sentWordIdx++;
                    continue;
                }

                // Count content words (any non-stop word with POS)
                if (pos != null && !pos.isEmpty()) {
                    contentWordCount++;
                }

                int score = wordBank.scoreWord(word, pos);
                int tier = computeTier(word, pos, score);

                if (tier <= 4) {
                    sentCandidates.add(new Candidate(
                        word, token.beginPosition() + offsetAdjustment, word.length(),
                        sentWordIdx, score, tier
                    ));
                }
                sentWordIdx++;
            }

            // Skip sentences with too few content words (greetings, trivial)
            if (contentWordCount < 2) {
                continue;
            }

            // Sort by (tier asc, score desc, position asc)
            sentCandidates.sort((a, b) -> {
                if (a.tier != b.tier) return Integer.compare(a.tier, b.tier);
                if (a.score != b.score) return Integer.compare(b.score, a.score);
                return Integer.compare(a.position, b.position);
            });

            // Take top MAX_BLANKS_PER_SENTENCE
            int take = Math.min(MAX_BLANKS_PER_SENTENCE, sentCandidates.size());
            for (int i = 0; i < take; i++) {
                blanks.add(sentCandidates.get(i).toMap());
            }
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
        final int tier;       // 0 = best, 4 = not selectable

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
            m.put("tier", tier);
            m.put("score", score);
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
     * Each returned map contains: word, position, length, tier, score.
     */
    public List<Map<String, Object>> generateBlanksForSentence(String text, int offsetAdjustment) {
        List<Map<String, Object>> result = generateBlanks(text, offsetAdjustment, false);
        // TEMP DEBUG
        System.out.println("[DEBUG] generateBlanksForSentence: text=\"" + text.substring(0, Math.min(50, text.length())) + "\" → blanks=" + result.size() + " " + result.stream().map(m -> m.get("word") + "(t" + m.get("tier") + ")").collect(java.util.stream.Collectors.joining(", ")));
        return result;
    }
}
