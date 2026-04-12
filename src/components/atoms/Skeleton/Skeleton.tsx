import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export default function Skeleton({ width, height, circle, className }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: circle ? '50%' : 'var(--radius-md)',
  };

  return (
    <div 
      className={`${styles.skeleton} ${className || ''}`} 
      style={style}
    >
      <div className={styles.shimmer} />
    </div>
  );
}
