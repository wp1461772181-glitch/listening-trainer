package com.listeningtrainer.service.tts;

import java.nio.file.Path;

/**
 * TTS service interface for generating audio from text.
 */
public interface TtsService {
    
    /**
     * Generate audio file from text.
     * 
     * @param text Text to synthesize
     * @param outputPath Output file path
     * @param voice Voice identifier (e.g., "female-us", "male-uk")
     * @param rate Speech rate (1.0 = normal)
     * @return true if successful, false otherwise
     */
    boolean generateAudio(String text, Path outputPath, String voice, double rate);
    
    /**
     * Get service name for logging.
     */
    String getServiceName();
}
