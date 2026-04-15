import React from 'react';
import styles from './Typography.module.css';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  color?: string; // e.g. 'cyan' mapped to var(--color-cyan)
}

export default function Heading({ level = 2, children, color, className, ...props }: HeadingProps) {
  const cn = `${styles.heading} ${styles[`h${level}`]} ${className || ''}`;
  const styleObj = {
    ...props.style,
    ...(color ? { color: `var(--color-${color}, ${color})` } : {})
  };
  switch (level) {
    case 1: return <h1 className={cn} style={styleObj} {...props}>{children}</h1>;
    case 2: return <h2 className={cn} style={styleObj} {...props}>{children}</h2>;
    case 3: return <h3 className={cn} style={styleObj} {...props}>{children}</h3>;
    case 4: return <h4 className={cn} style={styleObj} {...props}>{children}</h4>;
    case 5: return <h5 className={cn} style={styleObj} {...props}>{children}</h5>;
    case 6: return <h6 className={cn} style={styleObj} {...props}>{children}</h6>;
    default: return <h2 className={cn} style={styleObj} {...props}>{children}</h2>;
  }
}
