// ═══════════════════════════════════════════════════
// SekolahPintar — App Constants
// ═══════════════════════════════════════════════════

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  || (__DEV__ ? 'http://localhost:3000/api' : 'https://api.sekolahpintar.id/api');

export const APP_NAME = 'SekolahPintar';
export const APP_VERSION = '0.1.0';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@sp_access_token',
  REFRESH_TOKEN: '@sp_refresh_token',
  TEACHER_PROFILE: '@sp_teacher_profile',
  THEME_PREFERENCE: '@sp_theme',
  FONT_SIZE: '@sp_font_size',
  ONBOARDING_DONE: '@sp_onboarding_done',
} as const;

// Grade categories
export const GRADE_CATEGORIES = [
  { id: 'UH', label: 'Ulangan Harian', shortLabel: 'UH' },
  { id: 'UTS', label: 'Ujian Tengah Semester', shortLabel: 'UTS' },
  { id: 'UAS', label: 'Ujian Akhir Semester', shortLabel: 'UAS' },
  { id: 'TUGAS', label: 'Tugas', shortLabel: 'Tugas' },
  { id: 'KUIS', label: 'Kuis', shortLabel: 'Kuis' },
  { id: 'PRAKTIK', label: 'Praktik', shortLabel: 'Praktik' },
] as const;

// Attendance status config
export const ATTENDANCE_CONFIG = {
  HADIR: { label: 'Hadir', emoji: '✅', color: '#4CAF50', bgColor: '#E8F5E9' },
  IZIN: { label: 'Izin', emoji: '📝', color: '#2196F3', bgColor: '#E3F2FD' },
  SAKIT: { label: 'Sakit', emoji: '🏥', color: '#FF9800', bgColor: '#FFF3E0' },
  ALPA: { label: 'Alpa', emoji: '❌', color: '#F44336', bgColor: '#FFEBEE' },
} as const;

// Activity type icons
export const ACTIVITY_ICONS: Record<string, string> = {
  INPUT_NILAI: '📊',
  INPUT_ABSENSI: '📋',
  UPLOAD_MATERI: '📚',
  BUAT_TUGAS: '📝',
  BUAT_KUIS: '🧩',
  EDIT_NILAI: '✏️',
  EDIT_ABSENSI: '✏️',
  HAPUS_NILAI: '🗑️',
  HAPUS_ABSENSI: '🗑️',
  UNDO: '↩️',
};

// Days of week (Indonesian)
export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Tab routes
export const TAB_ROUTES = [
  { name: 'index', title: 'Kelas', icon: 'chatbubbles' },
  { name: 'groups', title: 'Grup', icon: 'people' },
  { name: 'calendar', title: 'Jadwal', icon: 'calendar' },
  { name: 'analytics', title: 'Analitik', icon: 'bar-chart' },
  { name: 'settings', title: 'Setelan', icon: 'settings' },
] as const;
