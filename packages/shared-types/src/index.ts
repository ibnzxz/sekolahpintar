// ═══════════════════════════════════════════════════
// SekolahPintar — Shared TypeScript Types
// ═══════════════════════════════════════════════════

// ──────────────────────────────
// API Response Types
// ──────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ──────────────────────────────
// Auth Types
// ──────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  teacher: TeacherProfile;
}

export interface TeacherProfile {
  id: string;
  fullName: string;
  email: string;
  role: TeacherRole;
  photoUrl: string | null;
  schoolId: string;
  schoolName: string;
  preferences: TeacherPreferences;
}

export interface TeacherPreferences {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}

// ──────────────────────────────
// Enums (matching Prisma enums)
// ──────────────────────────────

export type TeacherRole = 'GURU' | 'ADMIN' | 'KEPALA_SEKOLAH';
export type Gender = 'L' | 'P';
export type SchoolStatus = 'NEGERI' | 'SWASTA';
export type SchoolLevel = 'SD' | 'SMP' | 'SMA' | 'SMK';
export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
export type InputMethod = 'VOICE' | 'MANUAL' | 'QUIZ' | 'SYSTEM';
export type QuizType = 'LATIHAN' | 'ULANGAN';
export type QuestionType = 'PILIHAN_GANDA' | 'ISIAN_SINGKAT';
export type ActionType =
  | 'INPUT_NILAI'
  | 'INPUT_ABSENSI'
  | 'UPLOAD_MATERI'
  | 'BUAT_TUGAS'
  | 'BUAT_KUIS'
  | 'EDIT_NILAI'
  | 'EDIT_ABSENSI'
  | 'HAPUS_NILAI'
  | 'HAPUS_ABSENSI'
  | 'UNDO';
export type EventType = 'MENGAJAR' | 'ULANGAN' | 'RAPAT' | 'DEADLINE' | 'LAINNYA';
export type GroupType = 'MATA_PELAJARAN' | 'JENJANG' | 'UMUM';
export type MessageType = 'TEXT' | 'FILE' | 'ANNOUNCEMENT';
export type TemplateType = 'NILAI' | 'TUGAS' | 'PENGUMUMAN';

// ──────────────────────────────
// Class / Room Types
// ──────────────────────────────

export interface ClassRoom {
  id: string;
  name: string;
  gradeLevel: number;
  subjectName: string;
  subjectCode: string;
  classSubjectId: string;
  studentCount: number;
  lastActivity?: ActivityLogItem;
}

export interface ClassDetail {
  id: string;
  name: string;
  gradeLevel: number;
  subjects: ClassSubjectInfo[];
  students: StudentInfo[];
  homeroomTeacher?: { id: string; fullName: string };
}

export interface ClassSubjectInfo {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  scheduleDay: number | null;
  scheduleTime: string | null;
}

// ──────────────────────────────
// Student Types
// ──────────────────────────────

export interface StudentInfo {
  id: string;
  fullName: string;
  nickname: string | null;
  nisn: string | null;
  nis: string | null;
  gender: Gender | null;
  photoUrl: string | null;
}

export interface StudentProfile extends StudentInfo {
  birthDate: string | null;
  birthPlace: string | null;
  address: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherPhone: string | null;
  motherPhone: string | null;
  className: string;
  gradesSummary: SubjectGradeSummary[];
  attendanceSummary: AttendanceSummary;
}

export interface SubjectGradeSummary {
  subjectName: string;
  subjectCode: string;
  averageScore: number;
  gradeCount: number;
  entries: GradeEntryInfo[];
}

export interface GradeEntryInfo {
  id: string;
  title: string;
  score: number | null;
  maxScore: number;
  date: string | null;
  category: string | null;
}

export interface AttendanceSummary {
  totalDays: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
}

// ──────────────────────────────
// Grade Types
// ──────────────────────────────

export interface GradeInput {
  studentId: string;
  score: number;
  notes?: string;
}

export interface BatchGradeRequest {
  classSubjectId: string;
  semesterId: string;
  categoryId?: string;
  title: string;
  maxScore?: number;
  date?: string;
  inputMethod: InputMethod;
  grades: GradeInput[];
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  score: number | null;
  maxScore: number;
  notes: string | null;
  inputMethod: InputMethod;
  createdAt: string;
}

// ──────────────────────────────
// Attendance Types
// ──────────────────────────────

export interface AttendanceInput {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BatchAttendanceRequest {
  classId: string;
  date: string;
  inputMethod: InputMethod;
  attendances: AttendanceInput[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  notes: string | null;
  date: string;
  inputMethod: InputMethod;
}

// ──────────────────────────────
// Activity Log (Chat History)
// ──────────────────────────────

export interface ActivityLogItem {
  id: string;
  actionType: ActionType;
  inputMethod: InputMethod;
  summary: string;
  detailData: Record<string, unknown> | null;
  referenceType: string | null;
  referenceId: string | null;
  isUndone: boolean;
  teacherName: string;
  createdAt: string;
}

// ──────────────────────────────
// Voice Parser Types
// ──────────────────────────────

export type VoiceIntent =
  | 'INPUT_NILAI'
  | 'INPUT_ABSENSI'
  | 'BUAT_TUGAS'
  | 'UNDO'
  | 'UNKNOWN';

export interface VoiceParseResult {
  intent: VoiceIntent;
  confidence: number;
  rawText: string;
  entities: VoiceEntities;
  needsClarification: boolean;
  clarificationOptions?: ClarificationOption[];
}

export interface VoiceEntities {
  className?: string;
  subjectName?: string;
  grades?: Array<{
    studentName: string;
    matchedStudentId?: string;
    matchedStudentName?: string;
    score?: number;
    confidence: number;
  }>;
  attendance?: {
    defaultStatus: AttendanceStatus;
    exceptions: Array<{
      studentName: string;
      matchedStudentId?: string;
      matchedStudentName?: string;
      status: AttendanceStatus;
      confidence: number;
    }>;
  };
  assignment?: {
    description?: string;
    dueDate?: string;
  };
}

export interface ClarificationOption {
  type: 'student_disambiguation' | 'subject_disambiguation';
  originalText: string;
  options: Array<{
    id: string;
    name: string;
  }>;
}

// ──────────────────────────────
// Material Types
// ──────────────────────────────

export interface MaterialInfo {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize: number | null;
  teacherName: string;
  subjectName: string;
  createdAt: string;
}

// ──────────────────────────────
// Assignment Types
// ──────────────────────────────

export interface AssignmentInfo {
  id: string;
  title: string;
  description: string | null;
  attachmentUrl: string | null;
  dueDate: string | null;
  teacherName: string;
  subjectName: string;
  submissionCount: number;
  totalStudents: number;
  createdAt: string;
}

// ──────────────────────────────
// Quiz Types
// ──────────────────────────────

export interface QuizInfo {
  id: string;
  title: string;
  description: string | null;
  quizType: QuizType;
  questionCount: number;
  timeLimitMins: number | null;
  isPublished: boolean;
  attemptCount: number;
  averageScore: number | null;
  createdAt: string;
}

export interface QuizDetail extends QuizInfo {
  questions: QuizQuestionInfo[];
  subjectName: string;
  className: string;
}

export interface QuizQuestionInfo {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: string[] | null;
  correctAnswer: string;
  points: number;
  sortOrder: number;
  imageUrl: string | null;
}

// ──────────────────────────────
// Teacher Group / Collaboration
// ──────────────────────────────

export interface TeacherGroupInfo {
  id: string;
  name: string;
  description: string | null;
  groupType: GroupType;
  memberCount: number;
  lastMessage?: GroupMessageInfo;
}

export interface GroupMessageInfo {
  id: string;
  senderName: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  fileUrl: string | null;
  isPinned: boolean;
  createdAt: string;
}

// ──────────────────────────────
// Schedule / Calendar
// ──────────────────────────────

export interface ScheduleEventInfo {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  startTime: string;
  endTime: string | null;
  isRecurring: boolean;
  className?: string;
  subjectName?: string;
}

// ──────────────────────────────
// Analytics
// ──────────────────────────────

export interface AnalyticsOverview {
  totalStudents: number;
  totalClasses: number;
  averageGrade: number;
  attendanceRate: number;
  classStats: ClassAnalytics[];
  studentsAtRisk: StudentAtRisk[];
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  subjectName: string;
  studentCount: number;
  averageGrade: number;
  attendanceRate: number;
}

export interface StudentAtRisk {
  studentId: string;
  studentName: string;
  className: string;
  averageGrade: number;
  attendanceRate: number;
  reason: string;
}

// ──────────────────────────────
// Templates
// ──────────────────────────────

export interface InputTemplateInfo {
  id: string;
  name: string;
  templateType: TemplateType;
  templateData: Record<string, unknown>;
  createdAt: string;
}
