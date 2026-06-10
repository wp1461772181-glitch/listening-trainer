package com.listeningtrainer.service.tts;

import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.*;
import java.util.Map;

/**
 * Edge TTS service implementation.
 * Uses Microsoft Edge TTS (free, high quality neural voices).
 * Requires edge-tts Python package installed.
 */
@Service("edgeTtsService")
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
