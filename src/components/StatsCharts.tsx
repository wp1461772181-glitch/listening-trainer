import { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { apiGetPracticeRecords } from '../lib/api';
import Card from '../components/ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const tierTitles: Record<string, string> = { daily: 'Daily Life', campus: 'Campus Life', academic: 'Academic' };

export function DifficultyBarChart() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetPracticeRecords()
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    const tierCounts: Record<string, number> = { daily: 0, campus: 0, academic: 0 };
    const tierScores: Record<string, number[]> = { daily: [], campus: [], academic: [] };

    for (const r of records) {
      const tier = r.difficulty in tierCounts ? r.difficulty : 'daily';
      tierCounts[tier]++;
      tierScores[tier].push(r.score);
    }

    const tiers = ['daily', 'campus', 'academic'];
    return {
      labels: tiers.map(t => tierTitles[t]),
      counts: tiers.map(t => tierCounts[t]),
      colors: ['#10B981', '#F59E0B', '#4F46E5'],
    };
  }, [records]);

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin mx-auto" />
      </Card>
    );
  }

  const hasData = chartData.counts.some((c) => c > 0);

  if (!hasData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-text-secondary">Practice some lessons to see stats here.</p>
      </Card>
    );
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { font: { size: 10 }, stepSize: 1 } },
    },
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text mb-3">Lessons by Difficulty</h3>
      <div className="h-48">
        <Bar
          data={{
            labels: chartData.labels,
            datasets: [{
              data: chartData.counts,
              backgroundColor: chartData.colors,
              borderRadius: 6,
            }],
          }}
          options={barOptions}
        />
      </div>
    </Card>
  );
}

export function AccuracyRadarChart() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetPracticeRecords()
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (records.length === 0) return null;

    const allScores = records.map(r => r.score);
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const highCount = records.filter(r => r.score >= 80).length;
    const total = records.length;

    return {
      labels: ['Vocabulary', 'Grammar', 'Listening', 'Completion', 'Consistency'],
      values: [
        Math.min(100, Math.round(avgScore * 0.9)),
        Math.min(100, Math.round(avgScore * 0.85)),
        Math.min(100, Math.round(avgScore)),
        Math.min(100, Math.round((highCount / total) * 100)),
        Math.min(100, Math.round(total > 3 ? avgScore * 1.1 : avgScore * 0.7)),
      ],
    };
  }, [records]);

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin mx-auto" />
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-text-secondary">Practice some lessons to see accuracy breakdown.</p>
      </Card>
    );
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 25, font: { size: 9 }, backdropColor: 'transparent' },
        grid: { color: '#F3F4F6' },
        pointLabels: { font: { size: 11 }, color: '#374151' },
      },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text mb-3">Accuracy Breakdown</h3>
      <div className="h-48">
        <Radar
          data={{
            labels: chartData.labels,
            datasets: [{
              data: chartData.values,
              borderColor: '#4F46E5',
              backgroundColor: 'rgba(79, 70, 229, 0.15)',
              pointBackgroundColor: '#4F46E5',
              pointRadius: 3,
              borderWidth: 2,
              fill: true,
            }],
          }}
          options={radarOptions}
        />
      </div>
    </Card>
  );
}
