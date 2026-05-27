import type { ReactNode } from 'react';
import Card from './Card';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="py-16 text-center">
      <div className="mb-4 flex justify-center text-text-tertiary">
        {icon}
      </div>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-text-tertiary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
