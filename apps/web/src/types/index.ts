export interface Student {
  id: string;
  nisn: string;
  nis: string;
  fullName: string;
  nickname: string;
  gender: 'L' | 'P';
  birthPlace: string;
  birthDate: string;
  classId?: string;
  className?: string;
  fatherName?: string;
  motherName?: string;
  religion?: string;
  schoolId?: string;
}

export interface Teacher {
  id: string;
  nuptk: string;
  nip: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'GURU' | 'ADMIN' | 'KEPALA_SEKOLAH' | 'SUPER_ADMIN';
  gender: 'L' | 'P';
  isActive: boolean;
  schoolId?: string;
  schoolName?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  gradeLevel: number;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  studentCount: number;
  schoolId?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  schoolId?: string;
}

export interface ClassSubject {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  schoolId?: string;
}
