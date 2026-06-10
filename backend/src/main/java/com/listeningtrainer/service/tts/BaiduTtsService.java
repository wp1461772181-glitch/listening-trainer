package com.listeningtrainer.service.tts;

import org.springframework.stereotype.Service;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;

/**
 * Baidu TTS service implementation.
 * Uses Baidu Translate TTS API (free, no API key required).
 */
@Service("baiduTtsService")
public class BaiduTtsService implements TtsService {

    private static final String BAIDU_TTS_URL = "https://fanyi.baidu.com/gettts";

    @Override
    public boolean generateAudio(String text, Path outputPath, String voice, double rate) {
        try {
            // Baidu TTS: lan=en (US English, male default), lan=uk (British English, female sounding)
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
