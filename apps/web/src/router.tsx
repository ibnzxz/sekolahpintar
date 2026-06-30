import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StudentList } from './pages/students/StudentList';
import { TeacherList } from './pages/teachers/TeacherList';
import { ClassList } from './pages/classes/ClassList';
import { SubjectList } from './pages/subjects/SubjectList';
import { GradeReport } from './pages/reports/GradeReport';
import { AttendanceReport } from './pages/reports/AttendanceReport';
import { SchoolList } from './pages/schools/SchoolList';
import { Layout } from './components/Layout/Layout';

interface RouterProps {
  isAuthenticated: boolean;
  user: any;
  onLogin: (email: string, password: string) => Promise<any>;
  onLogout: () => void;
}

export const AppRouter: React.FC<RouterProps> = ({ isAuthenticated, user, onLogin, onLogout }) => {
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Wrapper for layout pages
  const wrap = (component: React.ReactNode, title: string) => (
    <Layout user={user} onLogout={onLogout} title={title}>
      {component}
    </Layout>
  );

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <Routes>
        <Route path="/super-admin/schools" element={wrap(<SchoolList />, 'Manajemen Klien Sekolah')} />
        <Route path="*" element={<Navigate to="/super-admin/schools" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={wrap(<Dashboard />, 'Dashboard Ringkasan Sekolah')} />
      <Route path="/students" element={wrap(<StudentList />, 'Manajemen Data Siswa')} />
      <Route path="/teachers" element={wrap(<TeacherList />, 'Manajemen Akun Pendidik')} />
      <Route path="/classes" element={wrap(<ClassList />, 'Manajemen Rombongan Belajar')} />
      <Route path="/subjects" element={wrap(<SubjectList />, 'Daftar Mata Pelajaran')} />
      <Route path="/reports/grades" element={wrap(<GradeReport />, 'Laporan Rekap Nilai Siswa')} />
      <Route path="/reports/attendance" element={wrap(<AttendanceReport />, 'Laporan Rekap Presensi Siswa')} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
