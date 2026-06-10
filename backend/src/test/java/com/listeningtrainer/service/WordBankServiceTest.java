package com.listeningtrainer.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class WordBankServiceTest {
    private final WordBankService service = new WordBankService(null); // null mapper = no DB

    @Test
    void testPureDigitsScoreZero() {
        assertEquals(0, service.scoreWord("2024", "CD"));
        assertEquals(0, service.scoreWord("123", "CD"));
        assertEquals(0, service.scoreWord("42", "CD"));
    }

    @Test
    void testCurrencyScoreZero() {
        assertEquals(0, service.scoreWord("$20", "CD"));
        assertEquals(0, service.scoreWord("€100", "CD"));
        assertEquals(0, service.scoreWord("£50", "CD"));
    }

    @Test
    void testPercentageScoreZero() {
        assertEquals(0, service.scoreWord("25%", "CD"));
        assertEquals(0, service.scoreWord("3.5%", "CD"));
    }

    @Test
    void testDecimalScoreZero() {
        assertEquals(0, service.scoreWord("3.14", "CD"));
        assertEquals(0, service.scoreWord("2.5", "CD"));
    }

    @Test
    void testWordsContainingDigitsScoreZero() {
        assertEquals(0, service.scoreWord("Room202", "NN"));
        assertEquals(0, service.scoreWord("iPhone15", "NN"));
    }
}
