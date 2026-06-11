import { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { apiGetPracticeRecords } from '../lib/api';
import Card from '../components/ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface TrendChartProps {
  days?: number;
}

export default function TrendChart({ days = 7 }: TrendChartProps) {
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

    const entries = records.slice(0, days).reverse();
    const labels = entries.map((e) => {
      const d = new Date(e.completedAt);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const scores = entries.map((e) => e.score);

    return {
      labels,
      datasets: [
        {
          label: 'Score',
          data: scores,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    };
  }, [records, days]);

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
        <p className="text-sm text-text-secondary">
          Practice some lessons to see your progress trend here.
        </p>
      </Card>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#F3F4F6' },
        ticks: {
          font: { size: 10 },
          callback: (v: number) => `${v}%`,
        },
      },
    },
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text mb-3">Score Trend (Last {days} sessions)</h3>
      <div className="h-48">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}
