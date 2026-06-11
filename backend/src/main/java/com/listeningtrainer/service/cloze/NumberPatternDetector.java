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
