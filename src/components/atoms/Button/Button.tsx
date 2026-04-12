import React from 'react';
import styles from './Button.module.css';
import Spinner from '../Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  icon,
  iconOnly,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth ? styles.fullWidth : '',
    iconOnly ? styles.iconOnly : '',
    loading ? styles.loading : '',
    className || ''
  ].filter(Boolean).join(' ');

  const spinnerColor = variant === 'primary' || variant === 'danger' ? '#fff' : 'var(--color-cyan)';

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <div className={styles.spinnerContainer}>
          <Spinner size="sm" color={spinnerColor} />
        </div>
      ) : null}
      <div className={`${styles.content} ${loading ? styles.invisible : ''}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {!iconOnly && children}
      </div>
    </button>
  );
}
