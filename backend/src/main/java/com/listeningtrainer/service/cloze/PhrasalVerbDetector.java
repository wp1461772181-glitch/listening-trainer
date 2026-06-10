package com.listeningtrainer.service.cloze;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PhrasalVerbDetector {

    // Base forms of phrasal verbs (dictionary will generate conjugations)
    private static final Set<String> PHRASAL_VERB_BASES = Set.of(
        "pick up", "pick up on", "look up", "look forward to", "look after",
        "turn on", "turn off", "turn up", "turn down",
        "give up", "give in", "give away",
        "come up with", "come across", "come along",
        "get along with", "get over", "get away",
        "put off", "put on", "put up with",
        "take off", "take over", "take up",
        "bring up", "bring about",
        "carry on", "carry out",
        "find out", "figure out", "work out", "point out",
        "go on", "go over", "go through",
        "break down", "break up",
        "check in", "check out",
        "fill in", "fill out",
        "hand in", "hand out",
        "set up", "set off",
        "show up", "show off",
        "turn out", "try on", "try out"
    );

    // Irregular verb conjugations
    private static final Map<String, List<String>> IRREGULAR_VERBS = new HashMap<>();
    
    static {
        IRREGULAR_VERBS.put("pick", List.of("pick", "picks", "picked", "picking"));
        IRREGULAR_VERBS.put("look", List.of("look", "looks", "looked", "looking"));
        IRREGULAR_VERBS.put("turn", List.of("turn", "turns", "turned", "turning"));
        IRREGULAR_VERBS.put("give", List.of("give", "gives", "gave", "given", "giving"));
        IRREGULAR_VERBS.put("come", List.of("come", "comes", "came", "coming"));
        IRREGULAR_VERBS.put("get", List.of("get", "gets", "got", "gotten", "getting"));
        IRREGULAR_VERBS.put("put", List.of("put", "puts", "putting"));
        IRREGULAR_VERBS.put("take", List.of("take", "takes", "took", "taken", "taking"));
        IRREGULAR_VERBS.put("bring", List.of("bring", "brings", "brought", "bringing"));
        IRREGULAR_VERBS.put("carry", List.of("carry", "carries", "carried", "carrying"));
        IRREGULAR_VERBS.put("find", List.of("find", "finds", "found", "finding"));
        IRREGULAR_VERBS.put("figure", List.of("figure", "figures", "figured", "figuring"));
        IRREGULAR_VERBS.put("work", List.of("work", "works", "worked", "working"));
        IRREGULAR_VERBS.put("point", List.of("point", "points", "pointed", "pointing"));
        IRREGULAR_VERBS.put("go", List.of("go", "goes", "went", "gone", "going"));
        IRREGULAR_VERBS.put("break", List.of("break", "breaks", "broke", "broken", "breaking"));
        IRREGULAR_VERBS.put("check", List.of("check", "checks", "checked", "checking"));
        IRREGULAR_VERBS.put("fill", List.of("fill", "fills", "filled", "filling"));
        IRREGULAR_VERBS.put("hand", List.of("hand", "hands", "handed", "handing"));
        IRREGULAR_VERBS.put("set", List.of("set", "sets", "setting"));
        IRREGULAR_VERBS.put("show", List.of("show", "shows", "showed", "shown", "showing"));
        IRREGULAR_VERBS.put("try", List.of("try", "tries", "tried", "trying"));
    }

    private Set<String> expandedPhrasalVerbs;

    public PhrasalVerbDetector() {
        expandedPhrasalVerbs = expandVerbs();
    }

    private Set<String> expandVerbs() {
        Set<String> expanded = new HashSet<>();
        
        for (String base : PHRASAL_VERB_BASES) {
            String[] parts = base.split("\\s+");
            String verb = parts[0];
            String rest = base.substring(verb.length()).trim();
            
            List<String> conjugations = IRREGULAR_VERBS.getOrDefault(verb, 
                List.of(verb, verb + "s", verb + "ed", verb + "ing"));
            
            for (String conj : conjugations) {
                expanded.add(conj + (rest.isEmpty() ? "" : " " + rest));
            }
        }
        
        return expanded;
    }

    public static class PhrasalVerbMatch {
        public final String fullPhrase;
        public final int start;
        public final int end;

        public PhrasalVerbMatch(String fullPhrase, int start, int end) {
            this.fullPhrase = fullPhrase;
            this.start = start;
            this.end = end;
        }
    }

    public List<PhrasalVerbMatch> detect(String text) {
        List<PhrasalVerbMatch> matches = new ArrayList<>();
        
        // Sort by length descending to match longer phrases first
        List<String> sortedVerbs = new ArrayList<>(expandedPhrasalVerbs);
        sortedVerbs.sort((a, b) -> b.length() - a.length());
        
        for (String verb : sortedVerbs) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(verb) + "\\b", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(text);
            
            while (matcher.find()) {
                int start = matcher.start();
                int end = matcher.end();
                
                // Check for overlap
                boolean overlaps = matches.stream()
                    .anyMatch(m -> !(end <= m.start || start >= m.end));
                
                if (!overlaps) {
                    matches.add(new PhrasalVerbMatch(matcher.group(), start, end));
                }
            }
        }
        
        matches.sort((a, b) -> Integer.compare(a.start, b.start));
        return matches;
    }
}
