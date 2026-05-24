import type { Lesson } from '../types';

export const lessons: Lesson[] = [
  // ===== Tier 1: Daily Life =====
  {
    id: 'daily-01',
    difficulty: 'daily',
    title: 'Ordering Coffee',
    sentence: 'I would like a medium latte with oat milk and a blueberry muffin, please.',
    hint: 'At a cafe. The speaker is ordering a drink and a snack.',
    audioPath: '/audio/daily-01.mp3',
  },
  {
    id: 'daily-02',
    difficulty: 'daily',
    title: 'Asking for Directions',
    sentence: 'Excuse me, could you tell me how to get to the nearest train station from here?',
    hint: 'On the street. Someone is lost and looking for public transport.',
    audioPath: '/audio/daily-02.mp3',
  },
  {
    id: 'daily-03',
    difficulty: 'daily',
    title: 'Making a Reservation',
    sentence: 'Hi, I would like to book a table for three people at seven o\'clock this evening.',
    hint: 'Calling a restaurant. The speaker wants to reserve a table.',
    audioPath: '/audio/daily-03.mp3',
  },
  {
    id: 'daily-04',
    difficulty: 'daily',
    title: 'Small Talk',
    sentence: 'The weather has been absolutely gorgeous lately, has not it? Perfect for a weekend hike.',
    hint: 'Casual conversation between colleagues. Talking about the weather and weekend plans.',
    audioPath: '/audio/daily-04.mp3',
  },
  {
    id: 'daily-05',
    difficulty: 'daily',
    title: 'At the Pharmacy',
    sentence: 'I have had a sore throat and a runny nose for about three days now. Do you have anything that could help?',
    hint: 'At a pharmacy. The speaker is describing symptoms to a pharmacist.',
    audioPath: '/audio/daily-05.mp3',
  },

  // ===== Tier 2: Campus Life =====
  {
    id: 'campus-01',
    difficulty: 'campus',
    title: 'Library Inquiry',
    sentence: 'I was wondering if the library has any study rooms available for booking this Friday afternoon.',
    hint: 'At the university library. A student is asking about study room availability.',
    audioPath: '/audio/campus-01.mp3',
  },
  {
    id: 'campus-02',
    difficulty: 'campus',
    title: 'Timetable Discussion',
    sentence: 'I am thinking of dropping this tutorial and switching to the Wednesday morning session instead.',
    hint: 'Two students talking about course schedules. One wants to change tutorial groups.',
    audioPath: '/audio/campus-02.mp3',
  },
  {
    id: 'campus-03',
    difficulty: 'campus',
    title: 'Student Services',
    sentence: 'The counselling service offers free appointments for all enrolled students throughout the semester.',
    hint: 'An announcement about campus support services available to students.',
    audioPath: '/audio/campus-03.mp3',
  },
  {
    id: 'campus-04',
    difficulty: 'campus',
    title: 'Group Project',
    sentence: 'We need to finalise the presentation slides by Thursday, otherwise we will not have time to rehearse.',
    hint: 'A group meeting. Discussing presentation deadlines and preparation.',
    audioPath: '/audio/campus-04.mp3',
  },
  {
    id: 'campus-05',
    difficulty: 'campus',
    title: 'Professor Office Hours',
    sentence: 'If you would like to discuss your essay feedback, my office hours are Tuesdays from two to four.',
    hint: 'A professor speaking after class about essay feedback and availability.',
    audioPath: '/audio/campus-05.mp3',
  },

  // ===== Tier 3: Academic Lecture =====
  {
    id: 'academic-01',
    difficulty: 'academic',
    title: 'Biology: Cell Structure',
    sentence: 'The mitochondria, often described as the powerhouse of the cell, are responsible for producing adenosine triphosphate through oxidative phosphorylation.',
    hint: 'First-year biology lecture. Introduction to cellular organelles and energy production.',
    audioPath: '/audio/academic-01.mp3',
  },
  {
    id: 'academic-02',
    difficulty: 'academic',
    title: 'Economics: Supply and Demand',
    sentence: 'When the price of a good increases, the quantity demanded typically decreases, assuming all other factors remain constant.',
    hint: 'Introductory economics. Explaining the fundamental law of demand.',
    audioPath: '/audio/academic-02.mp3',
  },
  {
    id: 'academic-03',
    difficulty: 'academic',
    title: 'History: Industrial Revolution',
    sentence: 'The Industrial Revolution fundamentally transformed agricultural societies into industrialised urban centres throughout the nineteenth century.',
    hint: 'Modern history lecture. Overview of the Industrial Revolution\'s impact on society.',
    audioPath: '/audio/academic-03.mp3',
  },
  {
    id: 'academic-04',
    difficulty: 'academic',
    title: 'Psychology: Memory',
    sentence: 'Working memory allows us to temporarily hold and manipulate information, which is crucial for reasoning and decision-making processes.',
    hint: 'Cognitive psychology lecture. Explaining the concept of working memory and its functions.',
    audioPath: '/audio/academic-04.mp3',
  },
  {
    id: 'academic-05',
    difficulty: 'academic',
    title: 'Environmental Science',
    sentence: 'Rising global temperatures have led to significant changes in precipitation patterns, affecting agricultural productivity across many regions.',
    hint: 'Environmental science lecture. Discussing climate change impacts on weather and farming.',
    audioPath: '/audio/academic-05.mp3',
  },
];

export function getLessonsByDifficulty(difficulty: string): Lesson[] {
  return lessons.filter((l) => l.difficulty === difficulty);
}

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getNextLessonId(currentId: string): string | null {
  const idx = lessons.findIndex((l) => l.id === currentId);
  if (idx >= 0 && idx < lessons.length - 1) return lessons[idx + 1].id;
  return null;
}
