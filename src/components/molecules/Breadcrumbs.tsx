import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      marginBottom: '20px', 
      fontSize: '13px', 
      fontFamily: 'var(--font-body)' 
    }}>
      <span 
        onClick={items[0].onClick}
        style={{ 
          color: 'var(--color-cyan)', 
          cursor: 'pointer', 
          fontWeight: 600,
          opacity: items.length === 1 ? 1 : 0.7
        }}
      >
        Daftar Master
      </span>
      
      {items.slice(1).map((item, idx) => (
        <React.Fragment key={idx}>
          <span style={{ color: 'var(--color-text-sub)' }}>/</span>
          <span 
            onClick={item.onClick}
            style={{ 
              color: 'var(--color-cyan)', 
              cursor: 'pointer', 
              fontWeight: 600,
              opacity: idx === items.length - 2 ? 1 : 0.7
            }}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
