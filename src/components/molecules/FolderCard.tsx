import React from 'react';
import styles from './FolderCard.module.css';

interface FolderCardProps {
  name: string;
  itemCount: number;
  onClick: () => void;
  type?: 'category' | 'model';
}

export default function FolderCard({ name, itemCount, onClick, type = 'category' }: FolderCardProps) {
  const isCategory = type === 'category';
  const colorAccent = isCategory ? 'var(--color-cyan-glow)' : 'var(--color-primary)';
  const dimAccent = isCategory ? 'var(--color-cyan-dim)' : 'rgba(184, 115, 51, 0.1)';

  return (
    <div 
      onClick={onClick}
      className={styles.card}
      style={{ '--accent': colorAccent, '--accent-dim': dimAccent } as any}
    >
      <div className={styles.iconWrapper}>
        {/* Glow Aura */}
        <div className={styles.glowAura} />
        
        {/* Futuristic SVG Folder */}
        <svg 
          viewBox="0 0 100 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={styles.folderSvg}
        >
          {/* Back Part */}
          <path 
            d="M5 15C5 12.2386 7.23858 10 10 10H35L42 18H90C92.7614 18 95 20.2386 95 23V65C95 67.7614 92.7614 70 90 70H10C7.23858 70 5 67.7614 5 65V15Z" 
            className={styles.folderBack}
          />
          
          {/* Neon Top Bar */}
          <rect x="10" y="22" width="80" height="2" fill={colorAccent} fillOpacity="0.8" />
          
          {/* Internal 'Data' Lines */}
          <rect x="20" y="35" width="40" height="1.5" fill={colorAccent} fillOpacity="0.2" />
          <rect x="20" y="42" width="60" height="1.5" fill={colorAccent} fillOpacity="0.1" />
          <rect x="20" y="49" width="30" height="1.5" fill={colorAccent} fillOpacity="0.15" />

          {/* Front Flap (Glass) */}
          <path 
            d="M5 25C5 22.2386 7.23858 20 10 20H90C92.7614 20 95 22.2386 95 25V65C95 67.7614 92.7614 70 90 70H10C7.23858 70 5 67.7614 5 65V25Z" 
            className={styles.folderFront}
          />

          {/* Shine Effect */}
          <path 
            d="M15 25L85 25L90 65L10 65L15 25Z" 
            fill="url(#shineGradient)" 
            fillOpacity="0.05"
          />

          <defs>
            <linearGradient id="shineGradient" x1="50" y1="20" x2="50" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Label (optional digital mark) */}
        <div className={styles.categoryMark}>
          {isCategory ? 'CAT' : 'MOD'}
        </div>
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.count}>
          {itemCount} {isCategory ? 'Model' : 'Varian'}
        </span>
      </div>
    </div>
  );
}
