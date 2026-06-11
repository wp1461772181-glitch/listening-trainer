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
