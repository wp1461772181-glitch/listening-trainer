package com.listeningtrainer.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private static final String BAIDU_TTS_URL = "https://fanyi.baidu.com/gettts";
    private static final int MAX_TEXT_LENGTH = 500;

    @GetMapping
    public ResponseEntity<byte[]> tts(
            @RequestParam String text,
            @RequestParam(defaultValue = "3") int spd) {

        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String truncated = text.length() > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;

        try {
            String encoded = URLEncoder.encode(truncated, StandardCharsets.UTF_8);
            String urlStr = BAIDU_TTS_URL + "?lan=en&text=" + encoded + "&spd=" + spd;

            HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            conn.connect();
            int status = conn.getResponseCode();
            if (status != 200) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
            }

            byte[] audio;
            try (InputStream is = conn.getInputStream();
                 ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                byte[] buf = new byte[4096];
                int n;
                while ((n = is.read(buf)) != -1) {
                    bos.write(buf, 0, n);
                }
                audio = bos.toByteArray();
            }

            conn.disconnect();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("audio/mpeg"));
            headers.setContentLength(audio.length);
            headers.setCacheControl("public, max-age=86400");

            return new ResponseEntity<>(audio, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
