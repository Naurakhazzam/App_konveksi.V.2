'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast, ToastType } from './ToastContext';
import styles from './Toast.module.css';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className={styles.container}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={16} />,
    error: <AlertCircle size={16} />,
    info: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
      className={`${styles.toast} ${styles[toast.type]}`}
    >
      <div className={styles.iconWrapper}>
        {icons[toast.type]}
      </div>
      
      <div className={styles.content}>
        <span className={styles.title}>{toast.title}</span>
        {toast.message && <span className={styles.message}>{toast.message}</span>}
      </div>

      <button className={styles.closeButton} onClick={() => onRemove(toast.id)}>
        <X size={14} />
      </button>

      {/* Progress Bar animation */}
      <motion.div 
        className={styles.progress}
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          height: '2px', 
          background: 'rgba(255,255,255,0.1)',
          pointerEvents: 'none'
        }}
      />
    </motion.div>
  );
}
