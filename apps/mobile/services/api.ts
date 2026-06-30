import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../constants';

const BASE_URL = API_BASE_URL.replace(/\/?$/, '');

export class ApiClient {
  static getHeaders() {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async getMyClasses() {
    try {
      const res = await fetch(`${BASE_URL}/teachers/my-classes`, {
        headers: this.getHeaders(),
      });
      if (res.status === 401) {
        useAuthStore.getState().logout();
        return [];
      }
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch classes from API", e);
      return [];
    }
  }

  static async getClassDetail(classId: string) {
    try {
      const res = await fetch(`${BASE_URL}/classes/${classId}`, {
        headers: this.getHeaders(),
      });
      if (res.status === 401) {
        useAuthStore.getState().logout();
        return null;
      }
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn("Failed to fetch class detail from API", e);
      return null;
    }
  }

  static async getClassActivity(classId: string) {
    try {
      const res = await fetch(`${BASE_URL}/classes/${classId}/activities`, {
        headers: this.getHeaders(),
      });
      if (res.status === 401) {
        useAuthStore.getState().logout();
        return [];
      }
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch class activities from API", e);
      return [];
    }
  }


  static async addClassActivity(classId: string, payload: any) {
    try {
      const res = await fetch(`${BASE_URL}/classes/${classId}/activities`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        useAuthStore.getState().logout();
        return null;
      }
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn("Failed to add class activity via API", e);
      return null;
    }
  }

  static async getClassSubjectGrades(classSubjectId: string) {
    try {
      const res = await fetch(`${BASE_URL}/grades/class-subject/${classSubjectId}`, {
        headers: this.getHeaders(),
      });
      if (res.status === 401) {
        useAuthStore.getState().logout();
        return [];
      }
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch class-subject grades via API", e);
      return [];
    }
  }

  static async getTodayAttendance(classId: string, dateStr: string) {
    try {
      const res = await fetch(`${BASE_URL}/attendance/class/${classId}?date=${dateStr}`, {
        headers: this.getHeaders(),
      });
      if (res.status === 401) {
        useAuthStore.getState().logout();
        return [];
      }
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch class attendance via API", e);
      return [];
    }
  }
}
