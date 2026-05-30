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
     * @param mode "dialogue" or "paragraph"
     * @return JSON array of sentence objects: [{text, displayText, blanksJson, speaker}, ...]
     */
    public String splitAndTag(String text, String mode) {
        boolean isDialogue = "dialogue".equalsIgnoreCase(mode);

        CoreDocument doc = new CoreDocument(text);
        pipeline.annotate(doc);

        List<Map<String, Object>> sentences = new ArrayList<>();
        int idx = 0;

        // For dialogue: track which speaker each sentence belongs to
        String currentSpeaker = null;

        for (CoreSentence sentence : doc.sentences()) {
            String sentenceText = sentence.text().trim();
            if (sentenceText.isEmpty()) continue;

            String speaker = null;
            String ttsText = sentenceText; // text sent to TTS (may strip speaker prefix)
            String displayText = sentenceText; // text shown on screen

            if (isDialogue) {
                Matcher m = SPEAKER_PATTERN.matcher(sentenceText);
                if (m.find()) {
                    currentSpeaker = m.group(1).trim();
                    speaker = currentSpeaker.toLowerCase();
                    // TTS text without speaker prefix
                    ttsText = sentenceText.substring(m.end()).trim();
                    // Display text keeps the full sentence
                    displayText = sentenceText;
                }
            }

            List<Map<String, Object>> blanks = generateBlanks(ttsText, isDialogue, speaker != null);

            // Limit blanks to max 4 per sentence for playability
            if (blanks.size() > 4) {
                blanks = blanks.subList(0, 4);
            }

            Map<String, Object> sentenceObj = new LinkedHashMap<>();
            sentenceObj.put("index", idx);
            sentenceObj.put("text", displayText);
            sentenceObj.put("ttsText", ttsText);
            sentenceObj.put("speaker", speaker);
            sentenceObj.put("blanksJson", blanks);

            sentences.add(sentenceObj);
            idx++;
        }

        try {
            return mapper.writeValueAsString(sentences);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize sentences", e);
        }
    }

    /**
     * Generate blanks from text.
     * For dialogue with speaker prefix: skip the first token if it's the speaker name.
     * For paragraph: use more aggressive blank selection (include adjectives, adverbs).
     */
    private List<Map<String, Object>> generateBlanks(String ttsText, boolean isDialogue, boolean hasSpeaker) {
        CoreDocument doc = new CoreDocument(ttsText);
        pipeline.annotate(doc);

        List<Map<String, Object>> blanks = new ArrayList<>();

        if (doc.sentences().isEmpty()) return blanks;

        CoreSentence sentence = doc.sentences().get(0);
        List<CoreLabel> tokens = sentence.tokens();
        int position = 0;

        // Track if we're past the speaker prefix area
        boolean pastSpeakerPrefix = false;

        for (CoreLabel token : tokens) {
            String pos = token.tag();
            String word = token.word();

            // For dialogue: skip tokens that are part of speaker prefix (usually first 1-2 tokens)
            if (isDialogue && hasSpeaker && !pastSpeakerPrefix) {
                // Skip first colon-terminated content (speaker name tokens)
                if (word.equals(":") || position == 0) {
                    position += word.length() + 1;
                    if (word.equals(":")) pastSpeakerPrefix = true;
                    continue;
                }
            }

            if (isDialogue) {
                // Dialogue mode: only nouns and verbs (more conservative)
                boolean isNoun = pos.startsWith("NN");
                boolean isVerb = pos.startsWith("VB");
                if (isNoun || isVerb) {
                    if (word.length() > 2) {
                        Map<String, Object> blank = new LinkedHashMap<>();
                        blank.put("word", word);
                        blank.put("position", position);
                        blank.put("length", word.length());
                        blanks.add(blank);
                    }
                }
            } else {
                // Paragraph mode: include nouns, verbs, adjectives, adverbs
                boolean isNoun = pos.startsWith("NN");
                boolean isVerb = pos.startsWith("VB");
                boolean isAdj = pos.startsWith("JJ");
                boolean isAdv = pos.startsWith("RB");
                if (isNoun || isVerb || isAdj || isAdv) {
                    if (word.length() > 2) {
                        Map<String, Object> blank = new LinkedHashMap<>();
                        blank.put("word", word);
                        blank.put("position", position);
                        blank.put("length", word.length());
                        blanks.add(blank);
                    }
                }
            }

            position += word.length() + 1;
        }

        return blanks;
    }

    /**
     * Backward-compatible method for non-dialogue mode.
     */
    public String splitAndTag(String text) {
        return splitAndTag(text, "paragraph");
    }
}
