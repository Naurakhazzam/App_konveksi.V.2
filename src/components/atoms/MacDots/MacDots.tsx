import React from 'react';
import styles from './MacDots.module.css';

export default function MacDots() {
  return (
    <div className={styles.container}>
      {['#ff5f57', '#ffbd2e', '#28ca41'].map((color, index) => (
        <div 
          key={color} 
          className={styles.dot} 
          style={{ 
            '--bg': color, 
            '--i': index 
          } as React.CSSProperties} 
        />
      ))}
    </div>
  );
}
