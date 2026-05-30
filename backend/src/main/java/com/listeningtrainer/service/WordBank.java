package com.listeningtrainer.service;

import org.springframework.stereotype.*;

import java.util.*;

/**
 * IELTS listening answer word bank for blank selection scoring.
 * Three tiers: blacklist (skip), core answer words (high priority), default scoring.
 */
@Service
public class WordBank {

    /**
     * Words that should NEVER be blanked. Includes:
     * - Generic verbs
     * - Pronouns & possessives
     * - Determiners
     * - Common prepositions
     * - Conjunctions
     * - Common adverbs
     * - Common adjectives
     * - Auxiliaries & modals
     * - Interjections & fillers
     */
    private static final Set<String> BLACKLIST = Set.of(
        // === Generic verbs ===
        "have", "has", "had", "do", "does", "did", "get", "got",
        "make", "made", "take", "took", "give", "gave", "go",
        "went", "come", "came", "like", "want", "need", "know",
        "think", "say", "see", "feel", "said", "tell", "told",
        "put", "set", "let", "keep", "kept", "held", "hold",
        "bring", "brought", "try", "tried", "ask", "asked",
        "use", "used", "find", "found", "work", "worked",
        "call", "called", "help", "helped", "move", "moved",
        "show", "shown", "turn", "turned", "play", "played",
        "look", "looked", "talk", "talked", "start", "started", "starts",
        "run", "ran", "hope", "hoped", "believe", "believed",
        "happen", "happened", "change", "changed", "prefer", "preferred",
        "hear", "heard", "listen", "listened", "read", "wrote", "write",
        "eat", "ate", "sleep", "slept", "wake", "woke",
        "pick", "picked", "fill", "filled",
        "speak", "spoke", "spoken", "choose", "chose", "chosen",
        "decide", "decided", "consider", "considered", "provide", "provided",
        "offer", "offered", "send", "sent", "receive", "received",
        "pay", "paid", "buy", "bought", "sell", "sold",
        "spend", "spent", "cost", "save", "allow", "allowed",
        "join", "joined", "enter", "entered", "leave", "left",
        "reach", "arrived", "meet", "met", "include", "included",

        // === Pronouns & possessives ===
        "i", "you", "he", "she", "it", "we", "they", "them",
        "me", "him", "her", "us", "my", "your", "his", "its",
        "our", "their", "mine", "yours", "hers", "ours", "theirs",
        "myself", "yourself", "himself", "herself", "itself",
        "ourselves", "themselves",
        "someone", "somebody", "anyone", "anybody", "everyone",
        "everybody", "nobody", "nothing", "something", "anything",
        "everything",

        // === Determiners ===
        "the", "a", "an", "this", "that", "these", "those",
        "some", "any", "no", "each", "every", "both", "few",
        "many", "much", "more", "most", "such", "own", "same",
        "other", "another", "all", "half",

        // === Common prepositions ===
        "in", "on", "at", "to", "for", "of", "from", "with",
        "by", "about", "up", "out", "over", "under", "into",
        "through", "after", "before", "between", "during",
        "around", "near", "off", "until", "since", "without",
        "within", "against", "along", "across", "towards",
        "down", "above", "below",

        // === Conjunctions ===
        "and", "but", "or", "so", "because", "if", "when",
        "where", "while", "although", "though", "however",
        "whether", "than", "unless",

        // === Common adverbs ===
        "now", "yes", "not", "very", "too",
        "just", "also", "only", "even", "still", "already",
        "quite", "really", "well", "back", "here",
        "there", "never", "always", "sometimes", "often",
        "usually", "probably", "maybe", "perhaps", "enough",
        "almost",
        "fine", "good", "bad", "great", "nice",
        "right", "wrong", "best", "worst", "better",
        "old", "new", "young", "big", "small", "long", "short",
        "fast", "slow", "high", "low", "hard", "soft",

        // === Auxiliaries & modals ===
        "is", "am", "are", "was", "were", "be", "been", "being",
        "can", "could", "will", "would", "shall", "should",
        "may", "might", "must",

        // === Interjections & fillers ===
        "oh", "mm", "erm", "um",
        "okay",

        // === Wh-words ===
        "who", "what", "which", "whose", "whom", "why", "how",

        // === Numbers (single digits) ===
        "one", "two", "three", "four", "five", "six",
        "zero",
        // Contractions (CoreNLP tokenizes these as separate words)
        "'s", "'re", "'ll", "'ve", "'d", "'m", "n't",
        // Punctuation-like
        "...", "uh", "ah"
    );

    /** High-frequency IELTS listening answer words across common scenes. */
    private static final Set<String> CORE_WORDS = Set.of(
        // Places
        "library", "gym", "campus", "station", "park", "museum",
        "restaurant", "airport", "hotel", "hospital", "cinema",
        "theatre", "stadium", "factory", "garden", "market", "cafe",
        "laboratory", "gallery", "pool", "harbour", "supermarket",
        "office", "studio", "warehouse",
        // Time
        "monday", "tuesday", "wednesday", "thursday", "friday",
        "saturday", "sunday", "january", "february", "march",
        "april", "june", "july", "august", "september",
        "october", "november", "december", "morning", "weekend",
        "evening", "afternoon", "midnight", "tomorrow", "yesterday",
        "fortnight", "semester", "vacation", "holiday",
        // Numbers/ordinals (larger ones)
        "seven", "eight", "nine", "ten", "eleven", "twelve",
        "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
        "eighty", "ninety", "hundred",
        "first", "second", "third", "fourth", "fifth", "sixth",
        "seventh", "eighth", "ninth", "tenth",
        // Daily life
        "routine", "schedule", "exercise", "breakfast", "dinner",
        "lunch", "bedroom", "kitchen", "bathroom", "furniture",
        "television", "computer", "telephone", "refrigerator",
        "washing", "machine", "apartment", "balcony", "ceiling",
        "curtain", "blanket", "pillow", "wardrobe", "drawer",
        // Campus/academic
        "lecture", "assignment", "seminar", "tutor", "exam",
        "essay", "dissertation", "research", "presentation",
        "deadline", "tuition", "scholarship", "notebook",
        "textbook", "bibliography",
        // Travel
        "ticket", "luggage", "passport", "flight", "journey",
        "booking", "reservation", "departure", "arrival",
        "destination", "itinerary", "accommodation", "visa",
        "currency", "embassy", "tourist", "souvenir",
        // Attitude/description
        "important", "convenient", "enjoyable", "comfortable",
        "excellent", "terrible", "difficult", "expensive",
        "reasonable", "sufficient", "adequate", "compulsory",
        "optional", "maximum", "minimum", "previous", "original",
        "temporary", "permanent", "regular", "flexible"
    );

    /**
     * Score a candidate word for blank selection.
     * Higher = better blank candidate.
     * @return 0 if blacklisted, 100+ if core word, 5-25 for others by POS
     */
    public int scoreWord(String word, String posTag) {
        String lower = word.toLowerCase();

        // Blacklist → instant rejection
        if (BLACKLIST.contains(lower)) return 0;

        // Filter out pure numbers, punctuation, ellipsis
        if (lower.matches("[\\d.,$%]+") || lower.equals("...") ||
            lower.matches("[a-zA-Z]*[-]{2,}[a-zA-Z]*")) return 0;

        int score;

        // Core answer word → top priority
        if (CORE_WORDS.contains(lower)) {
            score = 100;
        } else {
            // Default by POS tag
            score = defaultPosScore(posTag);
        }

        // Length bonus: longer words are more distinctive
        if (word.length() >= 6) score += 3;

        // Morphology bonuses
        if (lower.startsWith("un") || lower.startsWith("in") ||
            lower.startsWith("dis")) score += 2;

        if (lower.endsWith("ful") || lower.endsWith("less") ||
            lower.endsWith("tion")) score += 2;

        return score;
    }

    private int defaultPosScore(String posTag) {
        if (posTag == null || posTag.isEmpty()) return 5;

        if (posTag.startsWith("NN")) {
            return posTag.startsWith("NNP") ? 20 : 15;
        }
        if (posTag.startsWith("JJ")) return 10;
        if (posTag.startsWith("RB")) return 7;
        if (posTag.startsWith("VB")) return 5;
        return 5;
    }
}
