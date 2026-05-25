package com.listeningtrainer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private static final List<Map<String, Object>> LESSONS = List.of(
            // Daily Life
            lesson("daily-01", "daily", "Ordering Coffee",
                    "I would like a medium latte with oat milk and a blueberry muffin, please.",
                    "At a cafe. The speaker is ordering a drink and a snack."),
            lesson("daily-02", "daily", "Asking for Directions",
                    "Excuse me, could you tell me how to get to the nearest train station from here?",
                    "On the street. Someone is lost and looking for public transport."),
            lesson("daily-03", "daily", "Making a Reservation",
                    "Hi, I would like to book a table for three people at seven o'clock this evening.",
                    "Calling a restaurant. The speaker wants to reserve a table."),
            lesson("daily-04", "daily", "Small Talk",
                    "The weather has been absolutely gorgeous lately, has not it? Perfect for a weekend hike.",
                    "Casual conversation between colleagues. Talking about the weather and weekend plans."),
            lesson("daily-05", "daily", "At the Pharmacy",
                    "I have had a sore throat and a runny nose for about three days now. Do you have anything that could help?",
                    "At a pharmacy. The speaker is describing symptoms to a pharmacist."),
            // Campus Life
            lesson("campus-01", "campus", "Library Inquiry",
                    "I was wondering if the library has any study rooms available for booking this Friday afternoon.",
                    "At the university library. A student is asking about study room availability."),
            lesson("campus-02", "campus", "Timetable Discussion",
                    "I am thinking of dropping this tutorial and switching to the Wednesday morning session instead.",
                    "Two students talking about course schedules. One wants to change tutorial groups."),
            lesson("campus-03", "campus", "Student Services",
                    "The counselling service offers free appointments for all enrolled students throughout the semester.",
                    "An announcement about campus support services available to students."),
            lesson("campus-04", "campus", "Group Project",
                    "We need to finalise the presentation slides by Thursday, otherwise we will not have time to rehearse.",
                    "A group meeting. Discussing presentation deadlines and preparation."),
            lesson("campus-05", "campus", "Professor Office Hours",
                    "If you would like to discuss your essay feedback, my office hours are Tuesdays from two to four.",
                    "A professor speaking after class about essay feedback and availability."),
            // Academic Lectures
            lesson("academic-01", "academic", "Biology: Cell Structure",
                    "The mitochondria, often described as the powerhouse of the cell, are responsible for producing adenosine triphosphate through oxidative phosphorylation.",
                    "First-year biology lecture. Introduction to cellular organelles and energy production."),
            lesson("academic-02", "academic", "Economics: Supply and Demand",
                    "When the price of a good increases, the quantity demanded typically decreases, assuming all other factors remain constant.",
                    "Introductory economics. Explaining the fundamental law of demand."),
            lesson("academic-03", "academic", "History: Industrial Revolution",
                    "The Industrial Revolution fundamentally transformed agricultural societies into industrialised urban centres throughout the nineteenth century.",
                    "Modern history lecture. Overview of the Industrial Revolution's impact on society."),
            lesson("academic-04", "academic", "Psychology: Memory",
                    "Working memory allows us to temporarily hold and manipulate information, which is crucial for reasoning and decision-making processes.",
                    "Cognitive psychology lecture. Explaining the concept of working memory and its functions."),
            lesson("academic-05", "academic", "Environmental Science",
                    "Rising global temperatures have led to significant changes in precipitation patterns, affecting agricultural productivity across many regions.",
                    "Environmental science lecture. Discussing climate change impacts on weather and farming.")
    );

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getLessons() {
        return ResponseEntity.ok(LESSONS);
    }

    private static Map<String, Object> lesson(String id, String difficulty, String title,
                                               String sentence, String hint) {
        return Map.of(
                "id", id,
                "difficulty", difficulty,
                "title", title,
                "sentence", sentence,
                "hint", hint,
                "audioPath", "/audio/" + id + ".mp3"
        );
    }
}
