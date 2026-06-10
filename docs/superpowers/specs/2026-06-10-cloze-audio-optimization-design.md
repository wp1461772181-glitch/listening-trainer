# Cloze Algorithm & Audio Quality Optimization Design

**Date:** 2026-06-10  
**Branch:** codex  
**Status:** Draft

---

## Problem Statement

The current listening trainer has two major issues affecting learning effectiveness:

### Cloze Algorithm Issues

1. **Numbers/Dates/Addresses skipped**: IELTS listening heavily tests numbers (room numbers, dates, prices, phone numbers), but these are in SKIP_WORDS
2. **Phrasal verbs split incorrectly**: "pick up" becomes just "pick", losing the meaning
3. **No listening difficulty weighting**: All words treated equally, ignoring that weak forms (a, the, to) are harder to hear than stressed content words
4. **No context awareness**: Same word blanked multiple times across sentences

### Audio Quality Issues

1. **Mechanical TTS**: Baidu TTS has flat intonation, unnatural rhythm
2. **Fixed speed**: All sentences use spd=3, no variation for dialogue vs monologue
3. **Abrupt voice switching**: Male/female alternation in dialogue is jarring
4. **No natural pauses**: Sentences lack natural breathing points

---

## Design Goals

1. **More authentic IELTS-like experience**: Test what IELTS actually tests (numbers, dates, names, key vocabulary)
2. **Better listening comprehension training**: Include connected speech phenomena
3. **Natural-sounding audio**: Close to human speech quality
4. **Flexible voice options**: Multiple accents and voices available

---

## Cloze Algorithm Optimization

### A. Number/Date/Address Testing (Tier 0)

**Remove from SKIP_WORDS:**
- All number words (one, two, three... hundred, thousand)
- Date words (Monday, January, weekend, semester)
- Ordinal indicators (first, second, third)

**New detection patterns:**
```java
// Number patterns: "Room 305", "10:30", "$50", "15th"
Pattern NUMBER_PATTERN = Pattern.compile("\\d+[stndrh]?|\\d+:\\d+|\\$\\d+|£\\d+|€\\d+");

// Date patterns: "June 15th", "Monday", "next week"
Pattern DATE_PATTERN = Pattern.compile("(Monday|Tuesday|...|January|February|...)");

// Phone/ID patterns: "123-456-7890", "AB123"
Pattern ID_PATTERN = Pattern.compile("[A-Z0-9]+-[A-Z0-9]+|[A-Z]{2}\\d{3}");
```

**Scoring:**
- Number phrases: Tier 0 (score 100)
- Date expressions: Tier 0 (score 100)
- Addresses/IDs: Tier 0 (score 100)

### B. Phrasal Verb Protection

**Phrasal verb dictionary:**
```java
Set<String> PHRASAL_VERBS = Set.of(
    "pick up", "look up", "turn on", "turn off", "give up", 
    "come up with", "look forward to", "get along with",
    "put off", "take off", "bring up", "carry on",
    "find out", "figure out", "work out", "point out"
    // ... expand as needed
);
```

**Detection logic:**
1. Scan for phrasal verb patterns in sentence
2. If found, treat as single unit
3. Blank the verb part only (e.g., "pick up" → blank "pick", show "up")
4. Or blank entire phrase if short (e.g., "turn on" → one blank)

**Implementation:**
```java
private List<PhrasalVerbMatch> detectPhrasalVerbs(String text) {
    // Match against PHRASAL_VERBS dictionary
    // Return list of (start, end, verb, particle)
}

private List<Map<String, Object>> generateBlanksWithPhrasalVerbs(...) {
    // First detect phrasal verbs
    // Then generate blanks, protecting phrasal verb particles
}
```

### C. Listening Difficulty Weighting

**Weak form words (never blank, even if not in blacklist):**
```java
Set<String> WEAK_FORMS = Set.of(
    "a", "an", "the", "to", "for", "of", "at", "in", "on",
    "and", "but", "or", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did"
);
```

**Stress pattern bonus:**
- Words with strong stress on first syllable: +2 score
- Multi-syllable words with clear stress: +3 score
- Words that are commonly reduced in speech: -2 score

**Connected speech markers:**
- Words that trigger linking (end in consonant, next starts with vowel): mark for audio
- Words with assimilation (would you → /wʊdʒu/): mark for audio

### D. Context-Aware Deduplication

**Current behavior:** Same word blanked only once globally

**Enhanced behavior:**
- Same word, same meaning: blank once (current)
- Same word, different meaning: can blank separately
- Example: "book a ticket" vs "read a book" → both can be blanked

**Implementation:**
- Use WordNet or simple heuristic to detect meaning differences
- For now, use POS tag as proxy: "book" (verb) vs "book" (noun) = different meanings

---

## Audio Quality Optimization

### Approach: Switch to Edge TTS

**Why Edge TTS:**
- Free, no API key required
- Near-human quality (Microsoft neural voices)
- Multiple English accents: en-US, en-GB, en-AU
- SSML support for fine-grained control
- Can specify different voices for different speakers

**Voice selection:**
```java
Map<String, String> VOICE_MAP = Map.of(
    "male-us", "en-US-GuyNeural",
    "female-us", "en-US-JennyNeural",
    "male-uk", "en-GB-RyanNeural",
    "female-uk", "en-GB-LibbyNeural",
    "male-au", "en-AU-WilliamNeural",
    "female-au", "en-AU-NatashaNeural"
);
```

**SSML enhancements:**
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-JennyNeural">
    <prosody rate="1.0" pitch="+0Hz">
      <break time="500ms"/>
      Hello, <emphasis level="moderate">welcome</emphasis> to the library.
      <break time="300ms"/>
    </prosody>
  </voice>
</speak>
```

**Implementation:**
1. Add edge-tts Python dependency (or use HTTP API)
2. Create TtsService interface with implementations:
   - BaiduTtsService (existing, as fallback)
   - EdgeTtsService (new, default)
3. Generate SSML for each sentence with:
   - Appropriate voice based on speaker
   - Natural pauses (commas: 200ms, periods: 400ms, paragraphs: 800ms)
   - Emphasis on key words (blanks)
   - Rate adjustment: dialogue 1.05x, monologue 0.95x

**Dialogue voice assignment:**
```java
// Track speakers across conversation
Map<String, String> speakerVoiceMap = new HashMap<>();
String[] voicePool = {"female-us", "male-us", "female-uk", "male-uk"};
int voiceIdx = 0;

for (Sentence s : sentences) {
    String speaker = s.getSpeaker();
    if (speaker != null && !speakerVoiceMap.containsKey(speaker)) {
        speakerVoiceMap.put(speaker, voicePool[voiceIdx++ % voicePool.length]);
    }
    String voice = speakerVoiceMap.getOrDefault(speaker, "female-us");
    // Generate audio with this voice
}
```

---

## Architecture Changes

### Backend

**New files:**
- `service/tts/TtsService.java` (interface)
- `service/tts/EdgeTtsService.java` (implementation)
- `service/tts/BaiduTtsService.java` (refactored existing)
- `service/cloze/PhrasalVerbDetector.java`
- `service/cloze/NumberPatternDetector.java`

**Modified files:**
- `service/SentenceSplitter.java` (integrate new detectors)
- `service/LessonService.java` (use TtsService interface)
- `entity/LessonSentence.java` (add voice field if not present)

**Configuration:**
```yaml
# application.yml
tts:
  provider: edge  # or "baidu"
  default-voice: female-us
  rate:
    dialogue: 1.05
    monologue: 0.95
```

### Frontend

**New features:**
- Voice selection dropdown in lesson creation
- Accent preference in user settings (future)

**Modified files:**
- `routes/LessonCreatePage.tsx` (add voice selection)
- `types/index.ts` (add voice field)

---

## Testing Strategy

### Unit Tests

**Cloze algorithm:**
- Test number pattern detection: "Room 305" → blank "305"
- Test phrasal verb detection: "pick up the phone" → blank "pick"
- Test weak form filtering: "a book" → blank "book", not "a"
- Test deduplication: "book" (noun) and "book" (verb) → both blanked

**TTS:**
- Test SSML generation: proper breaks, emphasis, voice tags
- Test voice assignment: different speakers get different voices
- Test fallback: Edge TTS fails → Baidu TTS used

### Integration Tests

**End-to-end:**
1. Upload text with numbers, dates, phrasal verbs
2. Verify blanks are generated correctly
3. Generate audio
4. Verify audio files exist and are playable
5. Verify different speakers have different voices

### Manual Testing

**Audio quality:**
- Generate 10 sample sentences
- Compare Baidu vs Edge TTS quality
- Verify natural intonation and pauses
- Check voice variety in dialogues

**Cloze quality:**
- Test with IELTS sample texts
- Verify numbers/dates are blanked
- Verify phrasal verbs handled correctly
- Check blank distribution (not too many, not too few)

---

## Migration Plan

1. **Phase 1: Cloze algorithm** (no breaking changes)
   - Add new detectors
   - Update SentenceSplitter
   - Test with existing lessons
   - Deploy to codex branch

2. **Phase 2: Edge TTS** (backward compatible)
   - Add TtsService interface
   - Implement EdgeTtsService
   - Keep BaiduTtsService as fallback
   - Add configuration option
   - Test with existing lessons

3. **Phase 3: Frontend integration**
   - Add voice selection UI
   - Update lesson creation flow
   - Test end-to-end

4. **Phase 4: Testing & refinement**
   - Generate sample lessons
   - Manual testing
   - Adjust parameters (rate, pauses, emphasis)
   - Iterate until satisfied

5. **Phase 5: Deploy**
   - Merge to java branch
   - Deploy to ECS
   - Monitor for issues

---

## Success Criteria

**Cloze algorithm:**
- Numbers/dates blanked in 90%+ of test cases
- Phrasal verbs handled correctly (no split particles)
- Blank distribution: 15-25 blanks per 20 sentences
- User feedback: "more like real IELTS"

**Audio quality:**
- Edge TTS generates playable audio
- Natural intonation (no robotic monotone)
- Different speakers have different voices
- User feedback: "sounds like a real person"

**Overall:**
- No regression in existing functionality
- All tests pass
- Manual testing with 5+ sample lessons
- Ready for production deployment

---

## Risks & Mitigations

**Risk:** Edge TTS API changes or rate limits  
**Mitigation:** Keep Baidu TTS as fallback, add retry logic

**Risk:** Phrasal verb dictionary incomplete  
**Mitigation:** Start with common verbs, expand based on user feedback

**Risk:** SSML syntax errors cause TTS failures  
**Mitigation:** Validate SSML before sending, fallback to plain text

**Risk:** New cloze algorithm blanks too many words  
**Mitigation:** Keep global cap (max 25 blanks), test with real IELTS texts

---

## Future Enhancements

- User-selectable accent (US/UK/AU)
- Adjustable speech rate (slow/normal/fast)
- Connected speech markers in UI (show linking, assimilation)
- Word stress indicators
- Intonation pattern visualization
- Custom voice cloning (long-term)
