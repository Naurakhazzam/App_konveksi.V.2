'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type TransitionType = 'scale' | 'drift' | 'driftNatural' | 'fade';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  id?: string;
  className?: string;
}

const variants = {
  scale: {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(4px)' },
  },
  drift: {
    initial: { opacity: 0, y: 20, filter: 'blur(2px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -20, filter: 'blur(2px)' },
  },
  driftNatural: {
    initial: { opacity: 0, y: 60, filter: 'blur(3px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -30, filter: 'blur(3px)' },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }
};

export default function PageTransition({ children, type = 'driftNatural', id, className }: PageTransitionProps) {
  const isNatural = type === 'driftNatural';
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants[type]}
        transition={{
          duration: isNatural ? 1.6 : 0.8,
          ease: isNatural ? [0.16, 1, 0.3, 1] : [0.22, 1, 0.36, 1],
        }}
        className={className}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
