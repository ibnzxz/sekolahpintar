type ApiOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export class ApiClient {
  private static async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const token = localStorage.getItem('sp_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 401) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Sesi telah berakhir, silakan login kembali');
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Terjadi kesalahan');
    }
    return json.data ?? json;
  }

  // Auth
  static login(email: string, password: string): Promise<any> {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  }

  static getCurrentUser(): Promise<any> {
    return this.request('/auth/me');
  }

  static logout() {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    window.location.href = '/login';
  }

  // Classes
  static getTeacherClasses(): Promise<any[]> {
    return this.request('/classes');
  }

  static getClassDetail(classId: string): Promise<any> {
    return this.request(`/classes/${classId}`);
  }

  static getClassActivities(classId: string, page = 1, limit = 50): Promise<{ data: any[]; meta: any }> {
    return this.request(`/classes/${classId}/activities?page=${page}&limit=${limit}`);
  }

  static getClasses(): Promise<any[]> {
    return this.request('/admin/classes');
  }

  static saveClass(data: any): Promise<any> {
    return this.request('/admin/classes', { method: 'POST', body: data });
  }

  static getClassSubjects(): Promise<any[]> {
    return this.request('/admin/class-subjects');
  }

  static assignSubject(classId: string, subjectId: string, teacherId: string): Promise<any> {
    return this.request(`/admin/classes/${classId}/subjects`, {
      method: 'POST',
      body: { subjectId, teacherId },
    });
  }

  static removeSubject(classId: string, subjectId: string): Promise<any> {
    return this.request(`/admin/classes/${classId}/subjects/${subjectId}`, { method: 'DELETE' });
  }

  // Students
  static getStudents(): Promise<any[]> {
    return this.request('/admin/students');
  }

  static saveStudent(data: any): Promise<any> {
    if (data.id) {
      return this.request(`/admin/students/${data.id}`, { method: 'PUT', body: data });
    }
    return this.request('/admin/students', { method: 'POST', body: data });
  }

  static deleteStudent(id: string): Promise<any> {
    return this.request(`/admin/students/${id}`, { method: 'DELETE' });
  }

  static deleteAllStudents(): Promise<any> {
    return this.request('/admin/students', { method: 'DELETE' });
  }

  static importStudents(file: File): Promise<any> {
    const token = localStorage.getItem('sp_token');
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/admin/students/import', {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      body: formData,
    }).then(r => r.json()).then(j => { if (!j.success) throw new Error(j.message); return j.data; });
  }

  static downloadStudentTemplate(): Promise<Blob> {
    const token = localStorage.getItem('sp_token');
    return fetch('/api/admin/students/template', {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    }).then(r => r.blob());
  }

  // Teachers
  static getTeachers(): Promise<any[]> {
    return this.request('/admin/teachers');
  }

  static saveTeacher(data: any): Promise<any> {
    if (data.id) {
      return this.request(`/admin/teachers/${data.id}`, { method: 'PUT', body: data });
    }
    return this.request('/admin/teachers', { method: 'POST', body: data });
  }

  static importTeachers(file: File): Promise<any> {
    const token = localStorage.getItem('sp_token');
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/admin/teachers/import', {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      body: formData,
    }).then(r => r.json()).then(j => { if (!j.success) throw new Error(j.message); return j.data; });
  }

  static resetTeacherPassword(id: string): Promise<any> {
    return this.request(`/admin/teachers/${id}/reset-password`, { method: 'POST' });
  }

  // Subjects
  static getSubjects(): Promise<any[]> {
    return this.request('/admin/subjects');
  }

  static saveSubject(data: any): Promise<any> {
    if (data.id) {
      return this.request(`/admin/subjects/${data.id}`, { method: 'PUT', body: data });
    }
    return this.request('/admin/subjects', { method: 'POST', body: data });
  }

  static deleteSubject(id: string): Promise<any> {
    return this.request(`/admin/subjects/${id}`, { method: 'DELETE' });
  }

  // Schools
  static getSchools(): Promise<any[]> {
    return this.request('/admin/schools');
  }

  static createSchool(data: any): Promise<any> {
    return this.request('/admin/schools', { method: 'POST', body: data });
  }

  // Reports
  static getGradesReport(classSubjectId: string): Promise<any> {
    return this.request(`/admin/reports/grades?classSubjectId=${classSubjectId}`);
  }

  static getAttendanceReport(classId: string, startDate: string, endDate: string): Promise<any> {
    return this.request(`/admin/reports/attendance?classId=${classId}&startDate=${startDate}&endDate=${endDate}`);
  }

  // Analytics
  static getAnalytics(): Promise<any> {
    return this.request('/analytics/me');
  }
}
