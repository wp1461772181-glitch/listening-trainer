import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export default function Card({
  children,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  const base = 'bg-surface rounded-xl border border-border';
  const hover = interactive
    ? 'transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:border-border-strong cursor-pointer'
    : '';

  return (
    <div className={`${base} ${hover} ${className}`} {...props}>
      {children}
    </div>
  );
}
