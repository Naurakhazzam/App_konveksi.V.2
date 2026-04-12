import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const range = 2; // how many pages before/after current
  let pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || 
      i === totalPages || 
      (i >= currentPage - range && i <= currentPage + range)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - range - 1) || 
      (i === currentPage + range + 1)
    ) {
      pages.push('...');
    }
  }
  // Remove duplicate ellipses
  pages = pages.filter((item, pos) => pages.indexOf(item) === pos);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 8px',
      borderTop: '1px solid var(--color-border)',
      marginTop: '8px'
    }}>
      <div style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>
        Menampilkan <b>{startIdx}-{endIdx}</b> dari <b>{totalItems}</b> produk
      </div>
      
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={navButtonStyle}
        >
          &larr;
        </button>

        {pages.map((p, i) => (
          typeof p === 'number' ? (
            <button
              key={i}
              onClick={() => onPageChange(p)}
              style={{
                ...pageButtonStyle,
                background: currentPage === p ? 'var(--color-primary)' : 'var(--color-card2)',
                color: currentPage === p ? '#fff' : 'var(--color-text)',
                borderColor: currentPage === p ? 'var(--color-primary)' : 'var(--color-border)'
              }}
            >
              {p}
            </button>
          ) : (
            <span key={i} style={{ padding: '0 4px', color: 'var(--color-text-sub)' }}>{p}</span>
          )
        ))}

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={navButtonStyle}
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}

const pageButtonStyle: React.CSSProperties = {
  minWidth: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const navButtonStyle: React.CSSProperties = {
  ...pageButtonStyle,
  padding: '0 8px',
  background: 'var(--color-card2)',
  color: 'var(--color-text)',
};
