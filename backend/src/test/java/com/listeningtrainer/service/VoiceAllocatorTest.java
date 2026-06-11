package com.listeningtrainer.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class VoiceAllocatorTest {
    private final VoiceAllocator allocator = new VoiceAllocator();

    @Test
    void testSameSpeakerSameVoice() {
        String voice1 = allocator.allocateVoice(1L, "customer");
        String voice2 = allocator.allocateVoice(1L, "customer");
        assertEquals(voice1, voice2, "Same speaker should get same voice");
    }

    @Test
    void testDifferentSpeakersMayDiffer() {
        String voice1 = allocator.allocateVoice(1L, "customer");
        String voice2 = allocator.allocateVoice(1L, "agent");
        // Not guaranteed different, but both should be valid
        assertNotNull(voice1);
        assertNotNull(voice2);
    }

    @Test
    void testNullSpeakerDefault() {
        String voice = allocator.allocateVoice(1L, null);
        assertEquals("female_young", voice);
    }

    @Test
    void testMaleSpeakerGetsMaleVoice() {
        String voice = allocator.allocateVoice(1L, "John");
        assertTrue(voice.startsWith("male"), "John should get male voice, got: " + voice);
    }

    @Test
    void testFemaleSpeakerGetsFemaleVoice() {
        String voice = allocator.allocateVoice(1L, "Mary");
        assertTrue(voice.startsWith("female"), "Mary should get female voice, got: " + voice);
    }

    @Test
    void testClearCache() {
        allocator.allocateVoice(1L, "customer");
        allocator.clearCache(1L);
        // After clear, should still work
        String voice = allocator.allocateVoice(1L, "customer");
        assertNotNull(voice);
    }
}
