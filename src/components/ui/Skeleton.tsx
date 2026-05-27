import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export default function Skeleton({
  width = 'w-full',
  height = 'h-4',
  className = '',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`${width} ${height} rounded-lg bg-border animate-pulse ${className}`}
      {...props}
    />
  );
}
