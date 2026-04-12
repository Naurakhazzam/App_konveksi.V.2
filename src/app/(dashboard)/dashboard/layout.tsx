'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardTabs from '@/features/dashboard/components/DashboardTabs';

const PATH_ORDER = [
  '/dashboard',
  '/dashboard/produksi',
  '/dashboard/keuangan',
  '/dashboard/penggajian'
];

export default function DashboardSubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevIndex, setPrevIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const idx = PATH_ORDER.indexOf(pathname || '/dashboard');
    if (idx !== -1) {
      setPrevIndex(currentIndex);
      setCurrentIndex(idx);
    }
  }, [pathname]);

  const direction = currentIndex >= prevIndex ? 1 : -1;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      filter: 'blur(4px)',
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      filter: 'blur(4px)',
    }),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', overflow: 'hidden' }}>
      <DashboardTabs />
      
      <div style={{ position: 'relative', flex: 1 }}>
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={pathname}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 100, damping: 20, mass: 1 },
              opacity: { duration: 0.4 },
              filter: { duration: 0.4 }
            }}
            style={{ 
              width: '100%',
              height: '100%'
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
