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
     * @return JSON array of sentence objects
     */
    public String splitAndTag(String text, String mode) {
        boolean isDialogue = "dialogue".equalsIgnoreCase(mode);

        CoreDocument doc = new CoreDocument(text);
        pipeline.annotate(doc);

        List<Map<String, Object>> sentences = new ArrayList<>();
        int idx = 0;

        String currentSpeaker = null;

        for (CoreSentence sentence : doc.sentences()) {
            String sentenceText = sentence.text().trim();
            if (sentenceText.isEmpty()) continue;

            String speaker = null;
            String ttsText = sentenceText;
            int speakerPrefixLength = 0; // length of "Customer: " prefix

            if (isDialogue) {
                Matcher m = SPEAKER_PATTERN.matcher(sentenceText);
                if (m.find()) {
                    currentSpeaker = m.group(1).trim();
                    speaker = currentSpeaker.toLowerCase();
                    ttsText = sentenceText.substring(m.end()).trim();
                    speakerPrefixLength = m.end(); // includes trailing space after colon
                }
            }

            List<Map<String, Object>> blanks = generateBlanks(sentenceText, speakerPrefixLength, isDialogue);

            if (blanks.size() > 4) {
                blanks = blanks.subList(0, 4);
            }

            Map<String, Object> sentenceObj = new LinkedHashMap<>();
            sentenceObj.put("index", idx);
            sentenceObj.put("text", sentenceText);
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
     * Generate blanks from full sentence text.
     * Skips tokens within speakerPrefixLength (e.g. "Customer:").
     */
    private List<Map<String, Object>> generateBlanks(String fullText, int speakerPrefixLength, boolean isDialogue) {
        CoreDocument doc = new CoreDocument(fullText);
        pipeline.annotate(doc);

        List<Map<String, Object>> blanks = new ArrayList<>();

        if (doc.sentences().isEmpty()) return blanks;

        CoreSentence sentence = doc.sentences().get(0);
        List<CoreLabel> tokens = sentence.tokens();
        int position = 0;

        for (CoreLabel token : tokens) {
            String pos = token.tag();
            String word = token.word();
            int wordStart = position;
            int wordEnd = position + word.length();

            position += word.length() + 1; // +1 for space/punctuation separator

            // Skip tokens within speaker prefix area
            if (wordEnd <= speakerPrefixLength) continue;

            if (word.length() <= 2) continue;

            if (isDialogue) {
                // Dialogue mode: only nouns and verbs (conservative)
                boolean isNoun = pos.startsWith("NN");
                boolean isVerb = pos.startsWith("VB");
                if (isNoun || isVerb) {
                    Map<String, Object> blank = new LinkedHashMap<>();
                    blank.put("word", word);
                    blank.put("position", wordStart);
                    blank.put("length", word.length());
                    blanks.add(blank);
                }
            } else {
                // Paragraph mode: include nouns, verbs, adjectives, adverbs
                boolean isNoun = pos.startsWith("NN");
                boolean isVerb = pos.startsWith("VB");
                boolean isAdj = pos.startsWith("JJ");
                boolean isAdv = pos.startsWith("RB");
                if (isNoun || isVerb || isAdj || isAdv) {
                    Map<String, Object> blank = new LinkedHashMap<>();
                    blank.put("word", word);
                    blank.put("position", wordStart);
                    blank.put("length", word.length());
                    blanks.add(blank);
                }
            }
        }

        return blanks;
    }

    /**
     * Backward-compatible method.
     */
    public String splitAndTag(String text) {
        return splitAndTag(text, "paragraph");
    }
}
