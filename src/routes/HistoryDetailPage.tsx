import { useParams, useNavigate } from 'react-router-dom';
import HistoryDetailPanel from '../components/HistoryDetailPanel';

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const progressId = parseInt(id!, 10);

  if (isNaN(progressId)) {
    return (
      <div className="rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm text-text-secondary">Invalid practice ID.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <HistoryDetailPanel
        progressId={progressId}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
