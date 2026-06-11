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
        assertEquals(18, matches.get(0).start);
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
