package com.listeningtrainer.service;

import org.springframework.stereotype.*;

/**
 * Thin wrapper that delegates scoring to WordBankService.
 * SentenceSplitter calls this class; actual logic lives in WordBankService
 * which loads words from the DB.
 */
@Service
public class WordBank {

    private final WordBankService wordBankService;

    public WordBank(WordBankService wordBankService) {
        this.wordBankService = wordBankService;
    }

    /**
     * Score a candidate word for blank selection.
     * Delegates to WordBankService which uses the DB-backed word bank.
     * @return 0 if blacklisted, 100+ if core word, 5-25 for others by POS
     */
    public int scoreWord(String word, String posTag) {
        return wordBankService.scoreWord(word, posTag);
    }
}
