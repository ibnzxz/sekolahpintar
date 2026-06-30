import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarRange, 
  FileSpreadsheet, 
  CheckSquare, 
  Settings,
  LogOut,
  School
} from 'lucide-react';

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const menuItems = user?.role === 'SUPER_ADMIN'
    ? [
        { path: '/super-admin/schools', label: 'Kelola Sekolah', icon: School },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/students', label: 'Data Siswa', icon: Users },
        { path: '/teachers', label: 'Data Guru', icon: GraduationCap },
        { path: '/classes', label: 'Manajemen Kelas', icon: CalendarRange },
        { path: '/subjects', label: 'Mata Pelajaran', icon: BookOpen },
        { path: '/reports/grades', label: 'Laporan Nilai', icon: FileSpreadsheet },
        { path: '/reports/attendance', label: 'Laporan Absensi', icon: CheckSquare },
      ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>🏫</span> SekolahPintar
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path} className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <Link to={item.path}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: 'var(--accent-teal)'
          }}>
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName || 'Administrator'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'ADMIN' ? 'Admin Sekolah' : 'Kepala Sekolah'}
            </div>
          </div>
        </div>
        
        <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ width: '100%', display: 'flex', gap: '8px' }}>
          <LogOut size={14} />
          Keluar
        </button>
      </div>
    </aside>
  );
};
