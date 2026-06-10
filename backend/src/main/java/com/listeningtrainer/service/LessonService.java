package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.*;
import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.*;
import com.listeningtrainer.mapper.*;
import com.listeningtrainer.service.tts.TtsService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.*;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

@Service
public class LessonService {

    private static final String AUDIO_DIR = "public/audio/lessons";

    private final LessonMapper lessonMapper;
    private final LessonSentenceMapper sentenceMapper;
    private final SentenceSplitter sentenceSplitter;
    private final TtsService primaryTts;
    private final TtsService fallbackTts;
    private final ObjectMapper objectMapper = new ObjectMapper();

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

    /**
     * Upload text, split sentences, generate blanks.
     * Returns lesson in "drafting" status.
     */
    public LessonResponse createDraft(Long userId, LessonUploadRequest request) {
        Lesson lesson = new Lesson();
        lesson.setUserId(userId);
        lesson.setTitle(request.getTitle());
        lesson.setDifficulty(request.getDifficulty());
        lesson.setHint(request.getHint());
        lesson.setStatus("drafting");
        lesson.setCreatedAt(java.time.Instant.now());
        lessonMapper.insert(lesson);

        String mode = request.getMode() != null ? request.getMode() : detectMode(request.getText());
        String sentencesJson = sentenceSplitter.splitAndTag(request.getText(), mode);

        try {
            List<Map<String, Object>> sentences = objectMapper.readValue(sentencesJson, List.class);
            String voice = request.getVoice() != null ? request.getVoice() : "female-us";

            for (Map<String, Object> s : sentences) {
                LessonSentence ls = new LessonSentence();
                ls.setLessonId(lesson.getId());
                ls.setSentenceIndex((Integer) s.get("index"));
                ls.setText((String) s.get("text"));
                // Store ttsText (without speaker prefix) for audio generation
                String ttsText = (String) s.get("ttsText");
                ls.setVoice(voice);
                // Store speaker info as JSON in audioPath temporarily (will be set properly in generateAudio)
                if (s.get("speaker") != null) {
                    ls.setAudioPath(null); // will be set during audio generation
                }
                ls.setBlanksJson(objectMapper.writeValueAsString(s.get("blanksJson")));
                sentenceMapper.insert(ls);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse sentences", e);
        }

        return getLessonById(lesson.getId(), userId);
    }

    /**
     * Update sentences after user review/edit.
     */
    public LessonResponse updateSentences(Long userId, Long lessonId, List<LessonSentenceEdit> edits) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            throw new RuntimeException("Lesson not found");
        }

        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getLessonId, lessonId);
        sentenceMapper.delete(wrapper);

        for (LessonSentenceEdit edit : edits) {
            LessonSentence ls = new LessonSentence();
            ls.setLessonId(lessonId);
            ls.setSentenceIndex(edit.getIndex());
            ls.setText(edit.getText());
            ls.setVoice("female-us");
            try {
                ls.setBlanksJson(objectMapper.writeValueAsString(edit.getBlanksJson()));
            } catch (Exception e) {
                ls.setBlanksJson("[]");
            }
            sentenceMapper.insert(ls);
        }

        return getLessonById(lessonId, userId);
    }

    /**
     * Regenerate blanks for all sentences using current word bank.
     * Re-runs the scoring algorithm on each sentence's text.
     * Adaptive cap: total blanks ≈ sentences/3, clamped to [8, 20].
     * Trim lowest-priority blanks if over cap, then deduplicate.
     */
    public LessonResponse regenerateBlanks(Long userId, Long lessonId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            throw new RuntimeException("Lesson not found");
        }

        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getLessonId, lessonId)
               .orderByAsc(LessonSentence::getSentenceIndex);
        List<LessonSentence> sentences = sentenceMapper.selectList(wrapper);

        // 1. Generate all blanks for every sentence
        Map<Long, List<Map<String, Object>>> blanksBySentence = new LinkedHashMap<>();
        List<Map<String, Object>> allBlanks = new ArrayList<>(); // flattened with sentenceId

        for (LessonSentence ls : sentences) {
            String ttsText = extractTtsText(ls.getText());
            int prefixLen = ls.getText().length() - ttsText.length();
            List<Map<String, Object>> blanks = sentenceSplitter.generateBlanksForSentence(ttsText, prefixLen);
            if (blanks.size() > 6) blanks = blanks.subList(0, 6);
            blanksBySentence.put(ls.getId(), new ArrayList<>(blanks));
            for (Map<String, Object> b : blanks) {
                Map<String, Object> withMeta = new LinkedHashMap<>(b);
                withMeta.put("sentenceId", ls.getId());
                allBlanks.add(withMeta);
            }
        }

        // 2. Deduplicate first: same word → keep only highest-priority occurrence
        allBlanks.sort((a, b) -> {
            int tierA = (Integer) a.getOrDefault("tier", 4);
            int tierB = (Integer) b.getOrDefault("tier", 4);
            if (tierA != tierB) return Integer.compare(tierA, tierB);
            int scoreA = (Integer) a.getOrDefault("score", 0);
            int scoreB = (Integer) b.getOrDefault("score", 0);
            if (scoreA != scoreB) return Integer.compare(scoreB, scoreA);
            return Integer.compare((Integer) a.getOrDefault("position", 0), (Integer) b.getOrDefault("position", 0));
        });
        Set<String> usedWords = new LinkedHashSet<>();
        List<Map<String, Object>> dedupedBlanks = new ArrayList<>();
        for (Map<String, Object> b : allBlanks) {
            String word = ((String) b.get("word")).toLowerCase();
            if (usedWords.add(word)) {
                dedupedBlanks.add(b);
            }
        }

        // 3. Adaptive cap: ~sentences/2, min 10, max 25
        int totalSentences = sentences.size();
        int globalCap = Math.max(10, Math.min(25, totalSentences / 2));

        // 4. Trim if over cap
        if (dedupedBlanks.size() > globalCap) {
            dedupedBlanks = dedupedBlanks.subList(0, globalCap);
        }

        // 5. Reassign blanks back to sentences
        Map<Long, List<Map<String, Object>>> trimmedBlanks = new HashMap<>();
        for (Map<String, Object> b : dedupedBlanks) {
            Long sid = (Long) b.get("sentenceId");
            // Strip tier/score before storing (keep only word/position/length for frontend)
            Map<String, Object> clean = new LinkedHashMap<>();
            clean.put("word", b.get("word"));
            clean.put("position", b.get("position"));
            clean.put("length", b.get("length"));
            trimmedBlanks.computeIfAbsent(sid, k -> new ArrayList<>()).add(clean);
        }

        for (LessonSentence ls : sentences) {
            List<Map<String, Object>> bl = trimmedBlanks.getOrDefault(ls.getId(), Collections.emptyList());
            // Re-sort by position for correct rendering
            bl.sort(Comparator.comparingInt(m -> (Integer) m.get("position")));
            try {
                ls.setBlanksJson(objectMapper.writeValueAsString(bl));
            } catch (Exception e) {
                ls.setBlanksJson("[]");
            }
            sentenceMapper.updateById(ls);
        }

        return getLessonById(lessonId, userId);
    }

    /**
     * Regenerate blanks for a single sentence.
     */
    public LessonResponse regenerateSentenceBlanks(Long userId, Long lessonId, Long sentenceId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            throw new RuntimeException("Lesson not found");
        }

        LessonSentence ls = sentenceMapper.selectById(sentenceId);
        if (ls == null || !ls.getLessonId().equals(lessonId)) {
            throw new RuntimeException("Sentence not found");
        }

        String ttsText = extractTtsText(ls.getText());
        int prefixLen = ls.getText().length() - ttsText.length();
        List<Map<String, Object>> blanks = sentenceSplitter.generateBlanksForSentence(ttsText, prefixLen);
        if (blanks.size() > 6) {
            blanks = blanks.subList(0, 6);
        }
        try {
            ls.setBlanksJson(objectMapper.writeValueAsString(blanks));
        } catch (Exception e) {
            ls.setBlanksJson("[]");
        }
        sentenceMapper.updateById(ls);

        return getLessonById(lessonId, userId);
    }

    /**
     * Generate TTS audio for all sentences.
     * Updates status to "ready" on success, "failed" on error.
     */
    public LessonResponse generateAudio(Long userId, Long lessonId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            throw new RuntimeException("Lesson not found");
        }

        lesson.setStatus("generating");
        lessonMapper.updateById(lesson);

        try {
            LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(LessonSentence::getLessonId, lessonId)
                   .orderByAsc(LessonSentence::getSentenceIndex);
            List<LessonSentence> sentences = sentenceMapper.selectList(wrapper);

            Path audioDir = Paths.get(AUDIO_DIR, String.valueOf(lessonId));
            Files.createDirectories(audioDir);

            // Track speaker for dialogue voice alternation
            String prevSpeaker = null;
            String currentVoice = "female-us";
            Map<String, String> speakerVoiceMap = new HashMap<>();
            String[] voicePool = {"female-us", "male-us", "female-uk", "male-uk"};
            int voiceIdx = 0;

            for (LessonSentence ls : sentences) {
                // Detect speaker prefix (e.g. "Customer:", "Barista:")
                String speaker = extractSpeaker(ls.getText());
                
                if (speaker != null) {
                    // Assign consistent voice to each speaker
                    if (!speakerVoiceMap.containsKey(speaker)) {
                        speakerVoiceMap.put(speaker, voicePool[voiceIdx % voicePool.length]);
                        voiceIdx++;
                    }
                    currentVoice = speakerVoiceMap.get(speaker);
                    prevSpeaker = speaker;
                } else if (prevSpeaker == null) {
                    // No speaker labels at all, use default
                    currentVoice = ls.getVoice() != null ? ls.getVoice() : "female-us";
                }
                
                ls.setVoice(currentVoice);
                sentenceMapper.updateById(ls);

                String ttsText = extractTtsText(ls.getText()); // strip speaker prefix for TTS
                String audioPath = generateTtsAudio(ttsText, audioDir, ls.getSentenceIndex(), ls.getVoice());
                ls.setAudioPath(audioPath);
                sentenceMapper.updateById(ls);
            }

            lesson.setStatus("ready");
            lessonMapper.updateById(lesson);
        } catch (Exception e) {
            e.printStackTrace();
            lesson.setStatus("failed");
            lessonMapper.updateById(lesson);
        }

        return getLessonById(lessonId, userId);
    }

    /**
     * Auto-detect whether text is dialogue or paragraph based on speaker prefix patterns.
     * Returns "dialogue" if at least 2 lines start with "Name:" pattern.
     */
    private static final java.util.regex.Pattern MODE_SPEAKER_PATTERN =
        java.util.regex.Pattern.compile("(?m)^\\s*[A-Za-z][A-Za-z\\s]{0,15}?:\\s");

    private String detectMode(String text) {
        java.util.regex.Matcher m = MODE_SPEAKER_PATTERN.matcher(text);
        int count = 0;
        while (m.find() && count < 2) count++;
        return count >= 2 ? "dialogue" : "paragraph";
    }

    /**
     * Detect speaker prefix like "Customer:" or "Barista:" from sentence start.
     * Returns the speaker name (lowercase) or null if no speaker prefix found.
     */
    private String extractSpeaker(String text) {
        int colonIdx = text.indexOf(':');
        if (colonIdx <= 0 || colonIdx > 20) return null;
        String prefix = text.substring(0, colonIdx).trim();
        // Must be a single word (no spaces) to be a speaker label
        if (prefix.contains(" ")) return null;
        return prefix.toLowerCase();
    }

    /**
     * Strip speaker prefix from text for TTS (e.g. "Customer: Hello" -> "Hello").
     */
    private String extractTtsText(String text) {
        int colonIdx = text.indexOf(':');
        if (colonIdx <= 0 || colonIdx > 20) return text;
        String prefix = text.substring(0, colonIdx).trim();
        if (prefix.contains(" ") || prefix.length() == 0) return text;
        return text.substring(colonIdx + 1).trim();
    }

    private String generateTtsAudio(String text, Path audioDir, int index, String voice) throws Exception {
        Path outputPath = audioDir.resolve(index + ".mp3");
        
        // Determine rate based on context (dialogue slightly faster)
        double rate = 1.0;
        
        // Try primary TTS first (Edge TTS)
        boolean success = primaryTts.generateAudio(text, outputPath, voice, rate);
        
        // Fallback to Baidu if Edge fails
        if (!success) {
            System.out.println("[TTS] " + primaryTts.getServiceName() + " failed, falling back to " + fallbackTts.getServiceName());
            success = fallbackTts.generateAudio(text, outputPath, voice, rate);
        }
        
        if (!success) {
            throw new RuntimeException("TTS generation failed for both services");
        }
        
        return "/audio/lessons/" + audioDir.getFileName() + "/" + index + ".mp3";
    }

    /**
     * Get lesson list for user.
     */
    public List<LessonResponse> getLessons(Long userId) {
        LambdaQueryWrapper<Lesson> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Lesson::getUserId, userId)
               .orderByDesc(Lesson::getCreatedAt);
        List<Lesson> lessons = lessonMapper.selectList(wrapper);

        // Load sentence counts for each lesson
        List<Long> lessonIds = lessons.stream().map(Lesson::getId).toList();
        Map<Long, Integer> sentenceCounts = new HashMap<>();
        if (!lessonIds.isEmpty()) {
            LambdaQueryWrapper<LessonSentence> sw = new LambdaQueryWrapper<>();
            sw.in(LessonSentence::getLessonId, lessonIds)
              .select(LessonSentence::getLessonId);
            for (LessonSentence ls : sentenceMapper.selectList(sw)) {
                sentenceCounts.merge(ls.getLessonId(), 1, Integer::sum);
            }
        }

        return lessons.stream()
                .map(l -> toLessonResponse(l, Collections.emptyList(), sentenceCounts.getOrDefault(l.getId(), 0)))
                .toList();
    }

    /**
     * Get single lesson with sentences.
     */
    public LessonResponse getLessonById(Long lessonId, Long userId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            return null;
        }

        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getLessonId, lessonId)
               .orderByAsc(LessonSentence::getSentenceIndex);
        List<LessonSentence> sentences = sentenceMapper.selectList(wrapper);

        return toLessonResponse(lesson, sentences);
    }

    public void deleteLesson(Long userId, Long lessonId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) return;

        LambdaQueryWrapper<LessonSentence> sw = new LambdaQueryWrapper<>();
        sw.eq(LessonSentence::getLessonId, lessonId);
        sentenceMapper.delete(sw);

        lessonMapper.deleteById(lessonId);

        try {
            Path audioDir = Paths.get(AUDIO_DIR, String.valueOf(lessonId));
            if (Files.exists(audioDir)) {
                Files.walk(audioDir)
                     .sorted(Comparator.reverseOrder())
                     .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
            }
        } catch (IOException ignored) {}
    }

    /**
     * Build response with full sentence details (for single lesson view).
     */
    private LessonResponse toLessonResponse(Lesson lesson, List<LessonSentence> sentences) {
        return toLessonResponse(lesson, sentences, sentences.size());
    }

    /**
     * Build response with sentence count only (for list view).
     */
    private LessonResponse toLessonResponse(Lesson lesson, List<LessonSentence> sentences, int sentenceCount) {
        LessonResponse resp = new LessonResponse();
        resp.setId(lesson.getId());
        resp.setTitle(lesson.getTitle());
        resp.setDifficulty(lesson.getDifficulty());
        resp.setHint(lesson.getHint());
        resp.setStatus(lesson.getStatus());
        resp.setCreatedAt(lesson.getCreatedAt());

        List<LessonSentenceResponse> sentenceResponses = new ArrayList<>();
        for (LessonSentence ls : sentences) {
            LessonSentenceResponse sr = new LessonSentenceResponse();
            sr.setId(ls.getId());
            sr.setIndex(ls.getSentenceIndex());
            sr.setText(ls.getText());
            sr.setAudioPath(ls.getAudioPath());
            sr.setVoice(ls.getVoice());
            try {
                sr.setBlanks(objectMapper.readValue(ls.getBlanksJson(), List.class));
            } catch (Exception e) {
                sr.setBlanks(Collections.emptyList());
            }
            sentenceResponses.add(sr);
        }
        // For list view, return placeholder sentences matching the count
        if (sentences.isEmpty() && sentenceCount > 0) {
            for (int i = 0; i < sentenceCount; i++) {
                LessonSentenceResponse sr = new LessonSentenceResponse();
                sr.setIndex(i);
                sr.setText("");
                sr.setBlanks(Collections.emptyList());
                sentenceResponses.add(sr);
            }
        }
        resp.setSentences(sentenceResponses);
        return resp;
    }
}
