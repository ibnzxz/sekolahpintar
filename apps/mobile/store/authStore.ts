import { create } from 'zustand';
import { API_BASE_URL } from '../constants';

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'GURU' | 'ADMIN';
  schoolName: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hydrate: () => void;
}

function saveToStorage(user: AuthUser | null, token: string | null) {
  try {
    if (user && token) {
      localStorage.setItem('auth-user', JSON.stringify(user));
      localStorage.setItem('auth-token', token);
    } else {
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-token');
    }
  } catch {}
}

function loadFromStorage(): { user: AuthUser | null; token: string | null } {
  try {
    const userStr = localStorage.getItem('auth-user');
    const token = localStorage.getItem('auth-token');
    if (userStr && token) {
      return { user: JSON.parse(userStr), token };
    }
  } catch {}
  return { user: null, token: null };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  ready: false,
  hydrate: () => {
    const { user, token } = loadFromStorage();
    set({ user, token, ready: true });
  },
  login: async (email, password = 'guru123') => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (json.success && json.data) {
        const user = {
          id: json.data.teacher.id,
          fullName: json.data.teacher.fullName,
          email: json.data.teacher.email,
          role: json.data.teacher.role,
          schoolName: json.data.teacher.schoolName || 'Sekolah Baru',
        };
        const token = json.data.accessToken;
        saveToStorage(user, token);
        set({ user, token });
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to connect to API server.");
      return false;
    }
  },
  logout: () => {
    saveToStorage(null, null);
    set({ user: null, token: null });
  },
}));
