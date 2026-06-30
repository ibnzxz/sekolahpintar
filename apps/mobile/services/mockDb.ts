// ═══════════════════════════════════════════════════
// SekolahPintar Mobile — Local Mock DB
// ═══════════════════════════════════════════════════

import { AttendanceStatus } from '../types';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../constants';

const BASE_URL = API_BASE_URL.replace(/\/?$/, '');

export interface Student {
  id: string;
  fullName: string;
  nickname: string;
  gender: 'L' | 'P';
}

export interface Activity {
  id: string;
  actionType: 'INPUT_NILAI' | 'INPUT_ABSENSI' | 'UPLOAD_MATERI' | 'BUAT_TUGAS' | 'UNDO';
  inputMethod: 'VOICE' | 'MANUAL';
  summary: string;
  createdAt: string;
  isUndone?: boolean;
}

export interface ClassInfo {
  id: string;
  name: string;
  subjectName: string;
  subjectCode: string;
  studentCount: number;
  students: Student[];
  activities: Activity[];
}

const INITIAL_CLASSES: ClassInfo[] = [
  {
    id: 'c1',
    name: '7A',
    subjectName: 'Matematika',
    subjectCode: 'MTK',
    studentCount: 5,
    students: [
      { id: 's1', fullName: 'Kenzo Aditya Pratama', nickname: 'Kenzo', gender: 'L' },
      { id: 's2', fullName: 'Putri Wulandari', nickname: 'Putri', gender: 'P' },
      { id: 's3', fullName: 'Bagas Pratama', nickname: 'Bagas', gender: 'L' },
      { id: 's4', fullName: 'Anisa Rahma Sari', nickname: 'Anisa', gender: 'P' },
      { id: 's5', fullName: 'Kenzo Prasetyo', nickname: 'Kenzo P', gender: 'L' },
    ],
    activities: [
      {
        id: 'act1',
        actionType: 'INPUT_NILAI',
        inputMethod: 'MANUAL',
        summary: '📊 Nilai Ulangan Harian 1 — Aljabar\n5 siswa dinilai\nRata-rata: 84.6',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'act2',
        actionType: 'INPUT_ABSENSI',
        inputMethod: 'VOICE',
        summary: '📋 Absensi 29 Juni 2026\n✅ 4 hadir | 📝 1 izin (Putri) | 🏥 0 sakit | ❌ 0 alpa\nKecuali: Putri Wulandari (Izin)',
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
  },
  {
    id: 'c2',
    name: '7B',
    subjectName: 'Bahasa Indonesia',
    subjectCode: 'BIND',
    studentCount: 4,
    students: [
      { id: 's6', fullName: 'Dimas Arya Putra', nickname: 'Dimas', gender: 'L' },
      { id: 's7', fullName: 'Salsabila Maharani', nickname: 'Salsa', gender: 'P' },
      { id: 's8', fullName: 'Farhan Dwi Cahyo', nickname: 'Farhan', gender: 'L' },
      { id: 's9', fullName: 'Zahra Aulia Putri', nickname: 'Zahra', gender: 'P' },
    ],
    activities: [
      {
        id: 'act3',
        actionType: 'INPUT_ABSENSI',
        inputMethod: 'MANUAL',
        summary: '📋 Absensi 29 Juni 2026\n✅ 4 hadir | 📝 0 izin | 🏥 0 sakit | ❌ 0 alpa',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  },
  {
    id: 'c3',
    name: '8A',
    subjectName: 'Matematika',
    subjectCode: 'MTK',
    studentCount: 3,
    students: [
      { id: 's10', fullName: 'Muhammad Iqbal', nickname: 'Iqbal', gender: 'L' },
      { id: 's11', fullName: 'Keysha Amelia', nickname: 'Keysha', gender: 'P' },
      { id: 's12', fullName: 'Raffi Ahmad Hidayat', nickname: 'Raffi', gender: 'L' },
    ],
    activities: [],
  },
];

import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../constants';

// Partitioned local storage helpers for offline mock mode
function getStored<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

function setStored<T>(key: string, data: T) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function getActiveEmail(): string {
  const state = useAuthStore.getState();
  return state.user?.email || 'budi@sekolahpintar.id';
}

function getOfflineClasses(): ClassInfo[] {
  const email = getActiveEmail();
  if (email === 'budi@sekolahpintar.id') {
    return getStored<ClassInfo[]>('sp_mobile_classes_budi', INITIAL_CLASSES);
  }
  return getStored<ClassInfo[]>('sp_mobile_classes_' + email, []);
}

function saveOfflineClasses(classes: ClassInfo[]) {
  const email = getActiveEmail();
  const key = email === 'budi@sekolahpintar.id' ? 'sp_mobile_classes_budi' : 'sp_mobile_classes_' + email;
  setStored(key, classes);
}

import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../constants';

const BASE_URL = API_BASE_URL.replace(/\/?$/, '');

export const mockMobileDb = {
  getClasses: async (): Promise<ClassInfo[]> => {
    const { token } = useAuthStore.getState();
    if (!token || token === 'mock-token') {
      return getOfflineClasses();
    }

    try {
      const response = await fetch(`${BASE_URL}/classes`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      if (json.success && json.data) {
        return json.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          subjectName: c.subjectName,
          subjectCode: c.subjectCode,
          studentCount: c.studentCount,
          students: [],
          activities: c.lastActivity ? [c.lastActivity] : [],
        }));
      }
    } catch (e) {
      console.warn("Failed to fetch classes from API, using local mock data.");
    }
    return getOfflineClasses();
  },
  
  getClassById: async (id: string): Promise<ClassInfo | undefined> => {
    const { token } = useAuthStore.getState();
    if (!token || token === 'mock-token') {
      return getOfflineClasses().find((c) => c.id === id);
    }

    try {
      const response = await fetch(`${BASE_URL}/classes/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      if (json.success && json.data) {
        const classDetail = json.data;
        
        // Load class activities
        let activities: any[] = [];
        try {
          const actRes = await fetch(`${BASE_URL}/classes/${id}/activity`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          const actJson = await actRes.json();
          if (actJson.success && actJson.data) {
            activities = actJson.data;
          }
        } catch {}

        // Find subject info from classes list
        let subjectName = 'Mata Pelajaran';
        let subjectCode = 'MAPEL';
        try {
          const listRes = await fetch(`${BASE_URL}/classes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const listJson = await listRes.json();
          const match = listJson.data?.find((c: any) => c.id === id);
          if (match) {
            subjectName = match.subjectName;
            subjectCode = match.subjectCode;
          }
        } catch {}

        return {
          id: classDetail.id,
          name: classDetail.name,
          subjectName,
          subjectCode,
          studentCount: classDetail.students.length,
          students: classDetail.students.map((s: any) => ({
            id: s.id,
            fullName: s.fullName,
            nickname: s.nickname || s.fullName.split(' ')[0],
            gender: s.gender || 'L',
          })),
          activities: activities.map((a: any) => ({
            id: a.id,
            actionType: a.actionType,
            inputMethod: a.inputMethod,
            summary: a.summary,
            createdAt: a.createdAt,
            isUndone: a.isUndone,
          })),
        };
      }
    } catch (e) {
      console.warn("Failed to fetch class detail from API, using fallback.");
    }
    return getOfflineClasses().find((c) => c.id === id);
  },
  
  addActivity: (classId: string, activity: Omit<Activity, 'id' | 'createdAt'>) => {
    const offlineList = getOfflineClasses();
    const c = offlineList.find((item) => item.id === classId);
    if (!c) return null;
    const newAct: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    c.activities.unshift(newAct);
    saveOfflineClasses(offlineList);
    return newAct;
  },

  undoLastActivity: (classId: string) => {
    const offlineList = getOfflineClasses();
    const c = offlineList.find((item) => item.id === classId);
    if (!c) return false;
    const lastActive = c.activities.find((a) => !a.isUndone);
    if (lastActive) {
      lastActive.isUndone = true;
      
      const undoAct: Activity = {
        id: `act-${Date.now()}`,
        actionType: 'UNDO',
        inputMethod: 'MANUAL',
        summary: `↩️ Membatalkan aksi terakhir: ${lastActive.summary.split('\n')[0]}`,
        createdAt: new Date().toISOString(),
      };
      c.activities.unshift(undoAct);
      saveOfflineClasses(offlineList);
      return true;
    }
    return false;
  },
};
