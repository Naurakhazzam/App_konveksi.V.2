import React from 'react';

interface FolderCardProps {
  name: string;
  itemCount: number;
  onClick: () => void;
  type?: 'category' | 'model';
}

export default function FolderCard({ name, itemCount, onClick, type = 'category' }: FolderCardProps) {
  return (
    <div 
      onClick={onClick}
      style={{
        width: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '16px',
        position: 'relative'
      }}
      className="folder-card"
    >
      <div style={{
        width: '100px',
        height: '80px',
        marginBottom: '12px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Shadow effect */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          width: '80px',
          height: '10px',
          background: 'rgba(0,0,0,0.3)',
          filter: 'blur(10px)',
          borderRadius: '50%'
        }} />
        
        {/* Main Folder Image */}
        <img 
          src="/assets/folder-glass.png" 
          alt="Folder"
          onError={(e) => {
            // Fallback to CSS Folder if image not found
            (e.target as any).style.display = 'none';
            (e.target as any).nextSibling.style.display = 'block';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))'
          }}
        />

        {/* CSS Fallback Folder (Glassmorphism) */}
        <div style={{
          display: 'none',
          width: '90px',
          height: '70px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px 24px 8px 8px',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '0',
            width: '40px',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '4px 4px 0 0',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderBottom: 'none'
          }} />
        </div>
      </div>

      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--color-text)',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%'
      }}>
        {name}
      </span>
      
      <span style={{
        fontSize: '11px',
        color: 'var(--color-text-sub)',
        marginTop: '4px'
      }}>
        {itemCount} {type === 'category' ? 'Model' : 'Varian'}
      </span>

      <style dangerouslySetInnerHTML={{ __html: `
        .folder-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-5px);
        }
        .folder-card:active {
          transform: scale(0.95);
        }
      `}} />
    </div>
  );
}
