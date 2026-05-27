import { useNavigate } from 'react-router-dom';
import CustomLessonForm from '../components/CustomLessonForm';
import type { Lesson } from '../types';

export default function CustomLessonPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <CustomLessonForm
        onBack={() => navigate('/')}
        onStart={(lesson: Lesson) => navigate(`/player/${lesson.id}`)}
        onSaved={() => navigate('/')}
      />
    </div>
  );
}
