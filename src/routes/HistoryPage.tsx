import { useNavigate } from 'react-router-dom';
import HistoryPanel from '../components/HistoryPanel';
import type { Lesson } from '../types';

export default function HistoryPage() {
  const navigate = useNavigate();

  const handleSelectLesson = (lesson: Lesson) => {
    navigate(`/history/${lesson.id}`);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <HistoryPanel onSelectLesson={handleSelectLesson} />
    </div>
  );
}
