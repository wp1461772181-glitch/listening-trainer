package com.listeningtrainer.service;

import org.springframework.stereotype.*;
import java.util.*;

/**
 * Allocate voices to speakers in dialogue mode.
 * Uses consistent hashing to ensure same speaker always gets same voice.
 */
@Service
public class VoiceAllocator {

    // Voice pool (must match tts_server.py VOICES)
    private static final List<String> FEMALE_VOICES = List.of(
        "female_young", "female_mature", "female_child"
    );

    private static final List<String> MALE_VOICES = List.of(
        "male_young", "male_mature", "male_child"
    );

    // Cache: lessonId -> (speaker -> voice)
    private final Map<Long, Map<String, String>> lessonVoiceMap = new HashMap<>();

    /**
     * Allocate a voice to a speaker.
     *
     * @param lessonId Lesson ID (for per-lesson caching)
     * @param speaker Speaker name (e.g., "customer", "agent")
     * @return Voice key (e.g., "female_young")
     */
    public String allocateVoice(Long lessonId, String speaker) {
        if (speaker == null || speaker.isEmpty()) {
            return "female_young"; // Default
        }

        // Get or create voice map for this lesson
        Map<String, String> voiceMap = lessonVoiceMap.computeIfAbsent(lessonId, k -> new HashMap<>());

        // Check if speaker already has a voice
        if (voiceMap.containsKey(speaker.toLowerCase())) {
            return voiceMap.get(speaker.toLowerCase());
        }

        // Allocate new voice based on speaker name guess
        List<String> voicePool = guessGender(speaker).equals("male") ? MALE_VOICES : FEMALE_VOICES;
        int hash = Math.abs(speaker.toLowerCase().hashCode());
        String voice = voicePool.get(hash % voicePool.size());

        voiceMap.put(speaker.toLowerCase(), voice);
        return voice;
    }

    /**
     * Guess gender from speaker name (simple heuristic).
     */
    private String guessGender(String speaker) {
        String lower = speaker.toLowerCase();

        // Common male indicators
        if (lower.contains("john") || lower.contains("mike") || lower.contains("david") ||
            lower.contains("james") || lower.contains("robert") || lower.contains("agent") ||
            lower.contains("man") || lower.contains("sir") || lower.contains("mr")) {
            return "male";
        }

        // Common female indicators
        if (lower.contains("mary") || lower.contains("sarah") || lower.contains("jenny") ||
            lower.contains("emma") || lower.contains("lisa") || lower.contains("customer") ||
            lower.contains("woman") || lower.contains("lady") || lower.contains("madam") ||
            lower.contains("mrs") || lower.contains("ms")) {
            return "female";
        }

        // Default: hash-based
        return speaker.hashCode() % 2 == 0 ? "male" : "female";
    }

    /**
     * Clear voice cache for a lesson (after audio generation).
     */
    public void clearCache(Long lessonId) {
        lessonVoiceMap.remove(lessonId);
    }
}
