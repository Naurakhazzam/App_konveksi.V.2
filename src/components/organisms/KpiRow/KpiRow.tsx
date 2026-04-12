import React from 'react';
import { motion } from 'framer-motion';
import styles from './KpiRow.module.css';

export interface KpiRowProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as any
    }
  },
};

export default function KpiRow({ children, columns = 4, className }: KpiRowProps) {
  return (
    <motion.div 
      className={`${styles.row} ${styles[`cols-${columns}`]} ${className || ''}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
