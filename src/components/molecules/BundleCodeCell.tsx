import React, { useState } from 'react';

interface BundleCodeCellProps {
  code: string;
}

export default function BundleCodeCell({ code }: BundleCodeCellProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah klik baris tabel jika ada
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <code style={{ 
        background: 'rgba(255,255,255,0.05)', 
        padding: '2px 6px', 
        borderRadius: '4px',
        color: 'var(--color-cyan)',
        border: '1px solid rgba(0,255,242,0.1)'
      }}>
        {code}
      </code>
      <button
        onClick={handleCopy}
        style={{
          background: copied ? 'var(--color-green)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '4px',
          padding: '2px 6px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '10px',
          transition: 'all 0.2s',
          minWidth: '45px'
        }}
        title="Klik untuk salin"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
