package com.listeningtrainer.config;

import org.springframework.context.annotation.*;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve generated audio files from filesystem
        // Matches /audio/lessons/{id}/{idx}.mp3 -> public/audio/lessons/{id}/{idx}.mp3
        registry.addResourceHandler("/audio/**")
                .addResourceLocations("file:./public/");
    }
}
