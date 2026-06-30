import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { useAuth } from './hooks/useAuth';

export const App: React.FC = () => {
  const { isAuthenticated, user, login, logout, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        color: '#f3f4f6',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(25, 211, 102, 0.1)',
            borderTopColor: 'var(--accent-teal)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <span>Memuat Aplikasi...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRouter 
        isAuthenticated={isAuthenticated} 
        user={user} 
        onLogin={login} 
        onLogout={logout} 
      />
    </BrowserRouter>
  );
};
