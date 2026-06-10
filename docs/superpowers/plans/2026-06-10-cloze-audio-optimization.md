# Cloze Algorithm & Audio Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize cloze blank generation to test IELTS-relevant content (numbers, dates, phrasal verbs) and switch to Edge TTS for natural-sounding audio with multiple voices.

**Architecture:** Add new detector classes for number patterns and phrasal verbs in SentenceSplitter. Create TtsService interface with EdgeTtsService and BaiduTtsService implementations. Frontend adds voice selection dropdown.

**Tech Stack:** Java 17, Spring Boot 3.3, Stanford CoreNLP 4.5.7, edge-tts Python package, React 18, TypeScript

---

## File Structure

**New files:**
- `backend/src/main/java/com/listeningtrainer/service/cloze/NumberPatternDetector.java` - Detect numbers, dates, addresses
- `backend/src/main/java/com/listeningtrainer/service/cloze/PhrasalVerbDetector.java` - Detect and protect phrasal verbs
- `backend/src/main/java/com/listeningtrainer/service/tts/TtsService.java` - TTS interface
- `backend/src/main/java/com/listeningtrainer/service/tts/EdgeTtsService.java` - Edge TTS implementation
- `backend/src/main/java/com/listeningtrainer/service/tts/BaiduTtsService.java` - Baidu TTS (refactored)
- `backend/src/test/java/com/listeningtrainer/service/cloze/NumberPatternDetectorTest.java`
- `backend/src/test/java/com/listeningtrainer/service/cloze/PhrasalVerbDetectorTest.java`
- `backend/src/test/java/com/listeningtrainer/service/SentenceSplitterTest.java`

**Modified files:**
- `backend/src/main/java/com/listeningtrainer/service/SentenceSplitter.java` - Integrate detectors
- `backend/src/main/java/com/listeningtrainer/service/LessonService.java` - Use TtsService
- `backend/pom.xml` - Add test dependencies
- `src/routes/LessonCreatePage.tsx` - Add voice selection
- `src/types/index.ts` - Add voice field

---

## Task 1: Number Pattern Detector (TDD)

**Files:**
- Create: `backend/src/test/java/com/listeningtrainer/service/cloze/NumberPatternDetectorTest.java`
- Create: `backend/src/main/java/com/listeningtrainer/service/cloze/NumberPatternDetector.java`

- [ ] **Step 1: Write failing test for number detection**

```java
package com.listeningtrainer.service.cloze;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class NumberPatternDetectorTest {

    private final NumberPatternDetector detector = new NumberPatternDetector();

    @Test
    void detectsRoomNumber() {
        List<NumberPatternDetector.NumberMatch> matches = detector.detect("My room number is 305.");
        assertEquals(1, matches.size());
        assertEquals("305", matches.get(0).text);
        assertEquals(21, matches.get(0).start);
    }

    @Test
    void detectsDateWithOrdinal() {
        List<NumberPatternDetector.NumberMatch> matches = detector.detect("The meeting is on June 15th.");
        assertEquals(1, matches.size());
        assertEquals("15th", matches.get(0).text);
    }

    @Test
    void detectsTime() {
        List<NumberPatternDetector.NumberMatch> matches = detector.detect("The train leaves at 10:30.");
        assertEquals(1, matches.size());
        assertEquals("10:30", matches.get(0).text);
    }

    @Test
    void detectsPrice() {
        List<NumberPatternDetector.NumberMatch> matches = detector.detect("It costs $50 per night.");
        assertEquals(1, matches.size());
        assertEquals("$50", matches.get(0).text);
    }

    @Test
    void detectsPhoneNumber() {
        List<NumberPatternDetector.NumberMatch> matches = detector.detect("Call me at 123-456-7890.");
        assertEquals(1, matches.size());
        assertEquals("123-456-7890", matches.get(0).text);
    }

    @Test
    void detectsMultipleNumbers() {
        List<NumberPatternDetector.NumberMatch> matches = detector.detect("Room 203, check-in at 3:00, costs $75.");
        assertEquals(3, matches.size());
    }

    @Test
    void noFalsePositives() {
        List<NumberPatternDetector.NumberMatch> matches = detector.detect("I have two cats and a dog.");
        assertEquals(0, matches.size());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && mvn test -Dtest=NumberPatternDetectorTest`
Expected: FAIL with "cannot find symbol: class NumberPatternDetector"

- [ ] **Step 3: Implement NumberPatternDetector**

```java
package com.listeningtrainer.service.cloze;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NumberPatternDetector {

    // Patterns for numbers, dates, times, prices, phone numbers
    private static final List<Pattern> PATTERNS = List.of(
        // Time: 10:30, 3:00 PM
        Pattern.compile("\\d{1,2}:\\d{2}(?:\\s*[APap][Mm])?"),
        // Phone: 123-456-7890, 1234-5678
        Pattern.compile("\\d{3,4}-\\d{3,4}(?:-\\d{3,4})?"),
        // Price: $50, £75, €100
        Pattern.compile("[$£€]\\d+(?:\\.\\d{2})?"),
        // Ordinal: 1st, 2nd, 3rd, 15th
        Pattern.compile("\\d{1,2}(?:st|nd|rd|th)"),
        // Plain number: 305, 2024
        Pattern.compile("\\d{2,4}")
    );

    public static class NumberMatch {
        public final String text;
        public final int start;
        public final int end;

        public NumberMatch(String text, int start, int end) {
            this.text = text;
            this.start = start;
            this.end = end;
        }
    }

    public List<NumberMatch> detect(String text) {
        List<NumberMatch> matches = new ArrayList<>();
        
        for (Pattern pattern : PATTERNS) {
            Matcher matcher = pattern.matcher(text);
            while (matcher.find()) {
                String matched = matcher.group();
                int start = matcher.start();
                int end = matcher.end();
                
                // Check for overlap with existing matches
                boolean overlaps = matches.stream()
                    .anyMatch(m -> !(end <= m.start || start >= m.end));
                
                if (!overlaps) {
                    matches.add(new NumberMatch(matched, start, end));
                }
            }
        }
        
        // Sort by position
        matches.sort((a, b) -> Integer.compare(a.start, b.start));
        return matches;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && mvn test -Dtest=NumberPatternDetectorTest`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/listeningtrainer/service/cloze/NumberPatternDetector.java
git add backend/src/test/java/com/listeningtrainer/service/cloze/NumberPatternDetectorTest.java
git commit -m "feat: add NumberPatternDetector for IELTS number testing"
```

---

## Task 2: Phrasal Verb Detector (TDD)

**Files:**
- Create: `backend/src/test/java/com/listeningtrainer/service/cloze/PhrasalVerbDetectorTest.java`
- Create: `backend/src/main/java/com/listeningtrainer/service/cloze/PhrasalVerbDetector.java`

- [ ] **Step 1: Write failing test for phrasal verb detection**

```java
package com.listeningtrainer.service.cloze;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class PhrasalVerbDetectorTest {

    private final PhrasalVerbDetector detector = new PhrasalVerbDetector();

    @Test
    void detectsPickUp() {
        List<PhrasalVerbDetector.PhrasalVerbMatch> matches = detector.detect("Please pick up the phone.");
        assertEquals(1, matches.size());
        assertEquals("pick up", matches.get(0).fullPhrase);
        assertEquals(7, matches.get(0).start);
        assertEquals(14, matches.get(0).end);
    }

    @Test
    void detectsLookForwardTo() {
        List<PhrasalVerbDetector.PhrasalVerbMatch> matches = detector.detect("I look forward to meeting you.");
        assertEquals(1, matches.size());
        assertEquals("look forward to", matches.get(0).fullPhrase);
    }

    @Test
    void detectsComeUpWith() {
        List<PhrasalVerbDetector.PhrasalVerbMatch> matches = detector.detect("She came up with a great idea.");
        assertEquals(1, matches.size());
        assertEquals("came up with", matches.get(0).fullPhrase);
    }

    @Test
    void detectsMultiplePhrasalVerbs() {
        List<PhrasalVerbDetector.PhrasalVerbMatch> matches = detector.detect("Turn on the light and turn off the TV.");
        assertEquals(2, matches.size());
    }

    @Test
    void caseInsensitive() {
        List<PhrasalVerbDetector.PhrasalVerbMatch> matches = detector.detect("Please PICK UP the phone.");
        assertEquals(1, matches.size());
    }

    @Test
    void noFalsePositives() {
        List<PhrasalVerbDetector.PhrasalVerbMatch> matches = detector.detect("I like to read books.");
        assertEquals(0, matches.size());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && mvn test -Dtest=PhrasalVerbDetectorTest`
Expected: FAIL with "cannot find symbol: class PhrasalVerbDetector"

- [ ] **Step 3: Implement PhrasalVerbDetector**

```java
package com.listeningtrainer.service.cloze;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PhrasalVerbDetector {

    private static final Set<String> PHRASAL_VERBS = Set.of(
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
        String lowerText = text.toLowerCase();
        
        // Sort by length descending to match longer phrases first
        List<String> sortedVerbs = new ArrayList<>(PHRASAL_VERBS);
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && mvn test -Dtest=PhrasalVerbDetectorTest`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/listeningtrainer/service/cloze/PhrasalVerbDetector.java
git add backend/src/test/java/com/listeningtrainer/service/cloze/PhrasalVerbDetectorTest.java
git commit -m "feat: add PhrasalVerbDetector to protect phrasal verbs"
```

---

## Task 3: Integrate Detectors into SentenceSplitter

**Files:**
- Modify: `backend/src/main/java/com/listeningtrainer/service/SentenceSplitter.java`

- [ ] **Step 1: Add detector fields and constructor injection**

Add to SentenceSplitter class:

```java
private final NumberPatternDetector numberDetector;
private final PhrasalVerbDetector phrasalVerbDetector;

public SentenceSplitter(WordBank wordBank, 
                       NumberPatternDetector numberDetector,
                       PhrasalVerbDetector phrasalVerbDetector) {
    this.wordBank = wordBank;
    this.numberDetector = numberDetector;
    this.phrasalVerbDetector = phrasalVerbDetector;
}
```

- [ ] **Step 2: Remove numbers/dates from SKIP_WORDS**

Remove these from SKIP_WORDS:
- All number words (one, two, three... hundred, thousand, million)
- Date words (monday, tuesday... january, february... weekend, semester)
- Ordinal words (first, second, third, fourth, fifth)

- [ ] **Step 3: Update generateBlanks to use detectors**

In `generateBlanks` method, before the main loop:

```java
// Detect number patterns
List<NumberPatternDetector.NumberMatch> numberMatches = numberDetector.detect(text);

// Detect phrasal verbs
List<PhrasalVerbDetector.PhrasalVerbMatch> phrasalVerbs = phrasalVerbDetector.detect(text);
```

Then in the token loop, check if token is part of a number or phrasal verb:

```java
int tokenStart = token.beginPosition();
int tokenEnd = token.endPosition();

// Check if part of number pattern
boolean isNumber = numberMatches.stream()
    .anyMatch(m -> tokenStart >= m.start && tokenEnd <= m.end);

if (isNumber) {
    // Add as Tier 0 candidate
    sentCandidates.add(new Candidate(
        token.word(), tokenStart + offsetAdjustment, token.word().length(),
        sentWordIdx, 100, 0
    ));
    sentWordIdx++;
    continue;
}

// Check if part of phrasal verb
boolean isPhrasalVerbParticle = phrasalVerbs.stream()
    .anyMatch(pv -> {
        // Only blank the verb part, not the particle
        String[] parts = pv.fullPhrase.split("\\s+");
        if (parts.length > 1) {
            // This is a multi-word phrasal verb
            // Check if current token is the particle (not the verb)
            int verbEnd = pv.start + parts[0].length();
            return tokenStart >= verbEnd && tokenEnd <= pv.end;
        }
        return false;
    });

if (isPhrasalVerbParticle) {
    // Skip particles (up, off, on, etc.)
    sentWordIdx++;
    continue;
}
```

- [ ] **Step 4: Run all tests**

Run: `cd backend && mvn test`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/listeningtrainer/service/SentenceSplitter.java
git commit -m "feat: integrate number and phrasal verb detectors into cloze algorithm"
```

---

## Task 4: TtsService Interface and Implementations

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/service/tts/TtsService.java`
- Create: `backend/src/main/java/com/listeningtrainer/service/tts/EdgeTtsService.java`
- Create: `backend/src/main/java/com/listeningtrainer/service/tts/BaiduTtsService.java`
- Modify: `backend/src/main/java/com/listeningtrainer/service/LessonService.java`

- [ ] **Step 1: Create TtsService interface**

```java
package com.listeningtrainer.service.tts;

import java.nio.file.Path;

public interface TtsService {
    /**
     * Generate TTS audio file.
     * @param text Text to synthesize
     * @param outputPath Output file path
     * @param voice Voice identifier (e.g., "female-us", "male-uk")
     * @param rate Speech rate (1.0 = normal)
     * @return true if successful, false if failed
     */
    boolean generateAudio(String text, Path outputPath, String voice, double rate);
    
    /**
     * Get service name for logging.
     */
    String getServiceName();
}
```

- [ ] **Step 2: Refactor existing Baidu TTS into BaiduTtsService**

Extract the `generateTtsAudio` method from LessonService into BaiduTtsService:

```java
package com.listeningtrainer.service.tts;

import org.springframework.stereotype.Service;
import java.io.*;
import java.net.*;
import java.nio.file.*;

@Service
public class BaiduTtsService implements TtsService {

    private static final String BAIDU_TTS_URL = "https://fanyi.baidu.com/gettts";

    @Override
    public boolean generateAudio(String text, Path outputPath, String voice, double rate) {
        try {
            String lang = voice.startsWith("female") ? "uk" : "en";
            int spd = (int) Math.round(rate * 3); // Map 1.0 -> 3
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String urlStr = BAIDU_TTS_URL + "?lan=" + lang + "&text=" + encoded + "&spd=" + spd;

            HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            conn.connect();

            if (conn.getResponseCode() != 200) {
                conn.disconnect();
                return false;
            }

            try (InputStream is = conn.getInputStream()) {
                Files.copy(is, outputPath, StandardCopyOption.REPLACE_EXISTING);
            }

            conn.disconnect();
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public String getServiceName() {
        return "Baidu TTS";
    }
}
```

- [ ] **Step 3: Implement EdgeTtsService**

```java
package com.listeningtrainer.service.tts;

import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.*;
import java.util.Map;

@Service
public class EdgeTtsService implements TtsService {

    private static final Map<String, String> VOICE_MAP = Map.of(
        "male-us", "en-US-GuyNeural",
        "female-us", "en-US-JennyNeural",
        "male-uk", "en-GB-RyanNeural",
        "female-uk", "en-GB-LibbyNeural",
        "male-au", "en-AU-WilliamNeural",
        "female-au", "en-AU-NatashaNeural"
    );

    @Override
    public boolean generateAudio(String text, Path outputPath, String voice, double rate) {
        try {
            String edgeVoice = VOICE_MAP.getOrDefault(voice, "en-US-JennyNeural");
            String rateStr = String.format("%+.0f%%", (rate - 1.0) * 100);
            
            // Build edge-tts command
            ProcessBuilder pb = new ProcessBuilder(
                "/Users/wupeng/Library/Python/3.9/bin/edge-tts",
                "--voice", edgeVoice,
                "--rate", rateStr,
                "--text", text,
                "--write-media", outputPath.toString()
            );
            
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Read output
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("[edge-tts] " + line);
            }
            
            int exitCode = process.waitFor();
            return exitCode == 0 && Files.exists(outputPath);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public String getServiceName() {
        return "Edge TTS";
    }
}
```

- [ ] **Step 4: Update LessonService to use TtsService**

Add to LessonService:

```java
private final TtsService primaryTts;
private final TtsService fallbackTts;

public LessonService(LessonMapper lessonMapper,
                    LessonSentenceMapper sentenceMapper,
                    SentenceSplitter sentenceSplitter,
                    @Qualifier("edgeTtsService") TtsService primaryTts,
                    @Qualifier("baiduTtsService") TtsService fallbackTts) {
    this.lessonMapper = lessonMapper;
    this.sentenceMapper = sentenceMapper;
    this.sentenceSplitter = sentenceSplitter;
    this.primaryTts = primaryTts;
    this.fallbackTts = fallbackTts;
}
```

Update `generateTtsAudio` method:

```java
private String generateTtsAudio(String text, Path audioDir, int index, String voice) throws Exception {
    Path outputPath = audioDir.resolve(index + ".mp3");
    
    // Determine rate based on context
    double rate = 1.0; // Can be adjusted based on dialogue/monologue
    
    // Try primary TTS first
    boolean success = primaryTts.generateAudio(text, outputPath, voice, rate);
    
    // Fallback to Baidu if Edge fails
    if (!success) {
        System.out.println("[TTS] Edge TTS failed, falling back to Baidu TTS");
        success = fallbackTts.generateAudio(text, outputPath, voice, rate);
    }
    
    if (!success) {
        throw new RuntimeException("TTS generation failed for both services");
    }
    
    return "/audio/lessons/" + audioDir.getFileName() + "/" + index + ".mp3";
}
```

- [ ] **Step 5: Run all tests**

Run: `cd backend && mvn test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/listeningtrainer/service/tts/
git add backend/src/main/java/com/listeningtrainer/service/LessonService.java
git commit -m "feat: add TtsService interface with Edge TTS and Baidu TTS implementations"
```

---

## Task 5: Frontend Voice Selection

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/routes/LessonCreatePage.tsx`

- [ ] **Step 1: Add voice field to types**

In `src/types/index.ts`, add to Lesson interface:

```typescript
export interface Lesson {
  id: number;
  title: string;
  difficulty: string;
  hint: string;
  status: LessonStatus;
  createdAt: string;
  sentences: LessonSentence[];
  voice?: string; // Add this field
}
```

- [ ] **Step 2: Add voice selection to LessonCreatePage**

In LessonCreatePage, add voice selection dropdown:

```tsx
const [voice, setVoice] = useState('female-us');

// In the form:
<div>
  <label className="block text-sm font-medium text-text mb-2">Voice</label>
  <select
    value={voice}
    onChange={(e) => setVoice(e.target.value)}
    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
  >
    <option value="female-us">Female (US)</option>
    <option value="male-us">Male (US)</option>
    <option value="female-uk">Female (UK)</option>
    <option value="male-uk">Male (UK)</option>
    <option value="female-au">Female (AU)</option>
    <option value="male-au">Male (AU)</option>
  </select>
</div>
```

Pass voice to API:

```typescript
const resp = await apiCreateLesson({ title, text, difficulty, hint, voice });
```

- [ ] **Step 3: Update API call**

In `src/lib/api.ts`, update `apiCreateLesson`:

```typescript
export async function apiCreateLesson(data: {
  title: string;
  text: string;
  difficulty?: string;
  hint?: string;
  voice?: string;
}): Promise<Lesson> {
  return request('/api/lessons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

- [ ] **Step 4: Test locally**

Run: `npm run dev`
Test: Create a lesson with different voice options

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts
git add src/routes/LessonCreatePage.tsx
git add src/lib/api.ts
git commit -m "feat: add voice selection to lesson creation"
```

---

## Task 6: Integration Testing

- [ ] **Step 1: Test cloze algorithm with IELTS sample**

Create test text with numbers, dates, phrasal verbs:

```
Customer: Hello, I'd like to book a room for June 15th.
Receptionist: Sure, that's Room 305. It costs $75 per night.
Customer: Great. What time can I check in?
Receptionist: You can check in at 3:00 PM. Please pick up your key at the front desk.
```

Verify:
- "305", "15th", "$75", "3:00" are blanked
- "pick up" is handled correctly (blank "pick", show "up")
- Different speakers get different voices

- [ ] **Step 2: Test audio generation**

Generate audio for the test lesson. Verify:
- Audio files are created
- Different voices for different speakers
- Natural intonation (if Edge TTS works)

- [ ] **Step 3: Test fallback**

If Edge TTS fails, verify Baidu TTS is used as fallback.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "test: integration testing for cloze and audio optimization"
```

---

## Success Criteria

- Numbers/dates blanked in 90%+ of test cases
- Phrasal verbs handled correctly
- Edge TTS generates playable audio (or Baidu fallback)
- Different speakers have different voices
- All tests pass
- Manual testing with 5+ sample lessons

