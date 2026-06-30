import React from 'react';
import { User, Bell, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="header">
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Cari..." 
            className="form-control" 
            style={{ 
              paddingLeft: '36px', 
              width: '220px', 
              fontSize: '0.85rem',
              height: '36px',
              backgroundColor: 'rgba(255,255,255,0.03)'
            }} 
          />
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-secondary)' }} />
        </div>

        <button style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          transition: 'background var(--transition-fast)'
        }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <Bell size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Standalone Mode</span>
        </div>
      </div>
    </header>
  );
};
