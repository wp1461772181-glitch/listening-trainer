package com.listeningtrainer.service;

import edu.stanford.nlp.ling.*;
import edu.stanford.nlp.pipeline.*;
import edu.stanford.nlp.util.*;
import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.*;

import java.util.*;
import java.util.stream.*;

@Service
public class SentenceSplitter {

    private static final Pipeline pipeline;
    private static final ObjectMapper mapper = new ObjectMapper();

    static {
        Properties props = new Properties();
        props.setProperty("annotators", "tokenize,ssplit,pos");
        props.setProperty("tokenize.language", "en");
        pipeline = new Pipeline(props);
    }

    /**
     * Split text into sentences and generate blanks for each.
     * Returns JSON array of sentence objects: [{text, blanksJson}, ...]
     * Each blanksJson is: [{word, position, length}]
     */
    public String splitAndTag(String text) {
        CoreDocument doc = pipeline.processToCoreDocument(text);

        List<Map<String, Object>> sentences = new ArrayList<>();
        int idx = 0;

        for (CoreLabel sentence : doc.sentences()) {
            String sentenceText = sentence.text().trim();
            if (sentenceText.isEmpty()) continue;

            List<CoreLabel> tokens = sentence.tokens();
            List<Map<String, Object>> blanks = new ArrayList<>();
            int position = 0;

            for (CoreLabel token : tokens) {
                String pos = token.tag();
                String word = token.word();
                String lemma = token.lemma();

                // Skip short words and function words
                if (word.length() <= 2) {
                    position += word.length() + 1;
                    continue;
                }

                // Nouns: NN, NNS, NNP, NNPS
                // Verbs: VB, VBD, VBG, VBN, VBP, VBZ
                boolean isNoun = pos.startsWith("NN");
                boolean isVerb = pos.startsWith("VB");

                if (isNoun || isVerb) {
                    Map<String, Object> blank = new LinkedHashMap<>();
                    blank.put("word", lemma);
                    blank.put("position", position);
                    blank.put("length", word.length());
                    blanks.add(blank);
                }

                position += word.length() + 1;
            }

            // Limit blanks to max 4 per sentence for playability
            if (blanks.size() > 4) {
                blanks = blanks.subList(0, 4);
            }

            Map<String, Object> sentenceObj = new LinkedHashMap<>();
            sentenceObj.put("index", idx);
            sentenceObj.put("text", sentenceText);
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
}
