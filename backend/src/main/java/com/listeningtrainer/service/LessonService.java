package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.*;
import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.*;
import com.listeningtrainer.mapper.*;
import org.springframework.stereotype.*;

import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

@Service
public class LessonService {

    private static final String BAIDU_TTS_URL = "https://fanyi.baidu.com/gettts";
    private static final String AUDIO_DIR = "public/audio/lessons";

    private final LessonMapper lessonMapper;
    private final LessonSentenceMapper sentenceMapper;
    private final SentenceSplitter sentenceSplitter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LessonService(LessonMapper lessonMapper,
                         LessonSentenceMapper sentenceMapper,
                         SentenceSplitter sentenceSplitter) {
        this.lessonMapper = lessonMapper;
        this.sentenceMapper = sentenceMapper;
        this.sentenceSplitter = sentenceSplitter;
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
            String voice = request.getVoice() != null ? request.getVoice() : "male";

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
            ls.setVoice("male");
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
            String currentVoice = "male";

            for (LessonSentence ls : sentences) {
                // Detect speaker prefix (e.g. "Customer:", "Barista:")
                String speaker = extractSpeaker(ls.getText());
                if (prevSpeaker == null && speaker == null) {
                    // No speaker labels at all, keep default male
                    currentVoice = "male";
                } else if (speaker != null && !speaker.equals(prevSpeaker)) {
                    currentVoice = currentVoice.equals("male") ? "female" : "male";
                }
                if (speaker != null) {
                    prevSpeaker = speaker;
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
        // Baidu TTS: lan=en (US English, male default), lan=uk (British English, female sounding)
        String lang = "female".equals(voice) ? "uk" : "en";
        String encoded = URLEncoder.encode(text, java.nio.charset.StandardCharsets.UTF_8);
        String urlStr = BAIDU_TTS_URL + "?lan=" + lang + "&text=" + encoded + "&spd=3";

        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(15000);
        conn.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        conn.connect();

        if (conn.getResponseCode() != 200) {
            conn.disconnect();
            throw new RuntimeException("TTS request failed");
        }

        Path outputPath = audioDir.resolve(index + ".mp3");
        try (InputStream is = conn.getInputStream()) {
            Files.copy(is, outputPath, StandardCopyOption.REPLACE_EXISTING);
        }

        conn.disconnect();
        return "/audio/lessons/" + audioDir.getFileName() + "/" + index + ".mp3";
    }

    /**
     * Get lesson list for user.
     */
    public List<LessonResponse> getLessons(Long userId) {
        LambdaQueryWrapper<Lesson> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Lesson::getUserId, userId)
               .orderByDesc(Lesson::getCreatedAt);
        return lessonMapper.selectList(wrapper).stream()
                .map(l -> toLessonResponse(l, Collections.emptyList()))
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

    private LessonResponse toLessonResponse(Lesson lesson, List<LessonSentence> sentences) {
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
        resp.setSentences(sentenceResponses);
        return resp;
    }
}
