import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  user: any;
  onLogout: () => void;
  title: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, title, children }) => {
  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        <Header title={title} />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};
