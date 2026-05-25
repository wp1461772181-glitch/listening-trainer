import type { Lesson } from '../types';
import { apiGetCustomLessons, apiCreateCustomLesson, apiDeleteCustomLesson } from '../lib/api';

export async function fetchCustomLessons(): Promise<Lesson[]> {
  try {
    const data = await apiGetCustomLessons();
    return data.map((d) => ({
      id: d.lessonKey,
      title: d.title,
      difficulty: d.difficulty as Lesson['difficulty'],
      hint: d.hint,
      sentence: d.sentence,
      voice: d.voice as 'male' | 'female',
    }));
  } catch {
    return [];
  }
}

export async function saveCustomLesson(lesson: Lesson): Promise<Lesson | null> {
  try {
    const data = await apiCreateCustomLesson({
      title: lesson.title,
      difficulty: lesson.difficulty,
      hint: lesson.hint,
      sentence: lesson.sentence,
      voice: lesson.voice || 'female',
    });
    return {
      id: data.lessonKey,
      title: data.title,
      difficulty: data.difficulty as Lesson['difficulty'],
      hint: data.hint,
      sentence: data.sentence,
      voice: data.voice as 'male' | 'female',
    };
  } catch {
    return null;
  }
}

export async function deleteCustomLesson(lessonKey: string): Promise<boolean> {
  try {
    await apiDeleteCustomLesson(lessonKey);
    return true;
  } catch {
    return false;
  }
}
