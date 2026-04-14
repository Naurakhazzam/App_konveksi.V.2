'use client';

import React from 'react';
import styles from './BorderBeam.module.css';

interface BorderBeamProps {
  color?: string;
  speed?: number; // seconds
  size?: number; // percentage
  thickness?: number; // px
  active?: boolean;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  color = 'var(--beam-color-1)',
  speed = 4,
  size = 2,
  active = true
}) => {
  if (!active) return null;

  return (
    <div 
      className="beam-border"
      style={{ 
        '--beam-color-1': color,
        '--beam-duration': `${speed}s`,
        '--beam-size': `${size}px`,
        '--beam-display': active ? 'block' : 'none',
      } as React.CSSProperties}
      aria-hidden="true"
    />
  );
};
