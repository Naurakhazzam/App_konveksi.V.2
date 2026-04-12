'use client';

import { useContext } from 'react';
import { ToastContext } from './ToastContext';

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return {
    toast: context.addToast,
    success: (title: string, message?: string) => context.addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => context.addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => context.addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => context.addToast({ type: 'info', title, message }),
  };
}
