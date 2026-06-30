/**
 * SekolahPintar Voice Parser
 * 
 * Parses natural language Bahasa Indonesia voice commands into structured intents.
 * Supports: input nilai, input absensi, buat tugas, undo.
 * Uses regex pattern matching + Fuse.js fuzzy name matching.
 */

import Fuse from 'fuse.js';

// ──────────────────────────────
// Types
// ──────────────────────────────

export type VoiceIntent = 'INPUT_NILAI' | 'INPUT_ABSENSI' | 'BUAT_TUGAS' | 'UNDO' | 'UNKNOWN';
export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';

export interface StudentRecord {
  id: string;
  fullName: string;
  nickname: string | null;
}

export interface ParseContext {
  /** Students in the currently active class */
  students: StudentRecord[];
  /** Current class name (e.g., "7A") */
  className?: string;
  /** Current subject name (e.g., "Matematika") */
  subjectName?: string;
}

export interface ParsedGrade {
  studentName: string;
  matchedStudentId?: string;
  matchedStudentName?: string;
  score?: number;
  confidence: number;
  ambiguousMatches?: Array<{ id: string; name: string }>;
}

export interface ParsedAttendance {
  defaultStatus: AttendanceStatus;
  exceptions: Array<{
    studentName: string;
    matchedStudentId?: string;
    matchedStudentName?: string;
    status: AttendanceStatus;
    confidence: number;
    ambiguousMatches?: Array<{ id: string; name: string }>;
  }>;
}

export interface ParsedAssignment {
  description?: string;
  dueDate?: string;
}

export interface ClarificationOption {
  type: 'student_disambiguation' | 'subject_disambiguation';
  originalText: string;
  options: Array<{ id: string; name: string }>;
}

export interface VoiceParseResult {
  intent: VoiceIntent;
  confidence: number;
  rawText: string;
  entities: {
    className?: string;
    subjectName?: string;
    grades?: ParsedGrade[];
    attendance?: ParsedAttendance;
    assignment?: ParsedAssignment;
  };
  needsClarification: boolean;
  clarificationOptions?: ClarificationOption[];
}

// ──────────────────────────────
// Fuzzy Matcher
// ──────────────────────────────

function createStudentMatcher(students: StudentRecord[]) {
  // Create searchable list with both full names and nicknames
  const searchableStudents = students.flatMap((s) => {
    const items = [{ id: s.id, name: s.fullName, original: s }];
    if (s.nickname) {
      items.push({ id: s.id, name: s.nickname, original: s });
    }
    return items;
  });

  const fuse = new Fuse(searchableStudents, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
  });

  return (query: string): { matches: Array<{ id: string; name: string; score: number }>; needsClarification: boolean } => {
    const results = fuse.search(query);

    if (results.length === 0) {
      return { matches: [], needsClarification: false };
    }

    // Get unique student IDs (since we search both full name and nickname)
    const uniqueResults = new Map<string, { id: string; name: string; score: number }>();
    for (const r of results) {
      const existing = uniqueResults.get(r.item.id);
      const score = 1 - (r.score || 0); // Convert Fuse score (0=perfect) to confidence (1=perfect)
      if (!existing || existing.score < score) {
        uniqueResults.set(r.item.id, {
          id: r.item.id,
          name: r.item.original.fullName,
          score,
        });
      }
    }

    const matches = Array.from(uniqueResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // If top match is very confident and significantly better than #2, no clarification needed
    if (matches.length === 1 && matches[0].score > 0.6) {
      return { matches, needsClarification: false };
    }
    if (matches.length >= 2 && matches[0].score > 0.7 && matches[0].score - matches[1].score > 0.2) {
      return { matches: [matches[0]], needsClarification: false };
    }

    // Multiple close matches → need clarification
    return {
      matches,
      needsClarification: matches.length > 1 && (matches[0].score - matches[matches.length - 1].score) < 0.3,
    };
  };
}

// ──────────────────────────────
// Intent Detection
// ──────────────────────────────

const INTENT_PATTERNS: Array<{ intent: VoiceIntent; patterns: RegExp[]; confidence: number }> = [
  {
    intent: 'UNDO',
    patterns: [
      /\b(batalkan|batal|undo|kembalikan|hapus)\b/i,
      /\bbatalkan\s+(nilai|absensi|absen)\s+(terakhir)?\b/i,
    ],
    confidence: 0.95,
  },
  {
    intent: 'INPUT_NILAI',
    patterns: [
      /\b(nilai|score|skor|nilainya)\b/i,
      /\bulangan\b/i,
      /\b(dapat|dapet)\s+\d+/i,
      /\b\w+\s+\d{2,3}\s*$/i, // "Kenzo 100"
    ],
    confidence: 0.85,
  },
  {
    intent: 'INPUT_ABSENSI',
    patterns: [
      /\b(absen|absensi|kehadiran|presensi)\b/i,
      /\b(hadir|izin|sakit|alpa|alfa|tidak hadir)\b/i,
      /\bsemua hadir\b/i,
    ],
    confidence: 0.85,
  },
  {
    intent: 'BUAT_TUGAS',
    patterns: [
      /\b(tugas|pr|pekerjaan rumah|homework)\b/i,
      /\bdikumpul(kan)?\b/i,
      /\bdeadline\b/i,
      /\bhalaman\s+\d+/i,
    ],
    confidence: 0.8,
  },
];

function detectIntent(text: string): { intent: VoiceIntent; confidence: number } {
  const normalizedText = text.toLowerCase().trim();

  for (const { intent, patterns, confidence } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return { intent, confidence };
      }
    }
  }

  return { intent: 'UNKNOWN', confidence: 0.1 };
}

// ──────────────────────────────
// Entity Extraction — Grades
// ──────────────────────────────

function extractGrades(text: string, context: ParseContext): ParsedGrade[] {
  const grades: ParsedGrade[] = [];
  const matchStudent = createStudentMatcher(context.students);
  const normalizedText = text.toLowerCase();

  // Pattern 1: "kelas 7A ulangan matematika, Kenzo 100, Putri 90, Bagas 85"
  // Extract comma-separated name+score pairs
  const multiPattern = /[,;]\s*(\w[\w\s]*?)\s+(\d{1,3})/g;
  let multiMatch;
  while ((multiMatch = multiPattern.exec(normalizedText)) !== null) {
    const studentName = multiMatch[1].trim();
    const score = parseInt(multiMatch[2], 10);
    if (score >= 0 && score <= 100) {
      const result = matchStudent(studentName);
      const grade: ParsedGrade = {
        studentName,
        score,
        confidence: result.matches.length > 0 ? result.matches[0].score : 0,
      };
      if (result.matches.length > 0) {
        grade.matchedStudentId = result.matches[0].id;
        grade.matchedStudentName = result.matches[0].name;
      }
      if (result.needsClarification) {
        grade.ambiguousMatches = result.matches.map((m) => ({ id: m.id, name: m.name }));
      }
      grades.push(grade);
    }
  }

  // Pattern 2: "nilai Kenzo matematika 100" (single entry)
  if (grades.length === 0) {
    const singlePatterns = [
      /nilai\s+(\w[\w\s]*?)\s+(?:\w+\s+)?(\d{1,3})/i,
      /(\w[\w\s]*?)\s+(?:dapat|dapet)\s+(\d{1,3})/i,
      /(\w+)\s+(\d{1,3})\s*$/i,
    ];

    for (const pattern of singlePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const studentName = match[1].trim();
        const score = parseInt(match[2], 10);

        // Skip if the "name" is actually a keyword
        const skipWords = ['kelas', 'ulangan', 'nilai', 'matematika', 'ipa', 'ips', 'bahasa', 'semua'];
        if (skipWords.includes(studentName.toLowerCase())) continue;

        if (score >= 0 && score <= 100) {
          const result = matchStudent(studentName);
          const grade: ParsedGrade = {
            studentName,
            score,
            confidence: result.matches.length > 0 ? result.matches[0].score : 0,
          };
          if (result.matches.length > 0) {
            grade.matchedStudentId = result.matches[0].id;
            grade.matchedStudentName = result.matches[0].name;
          }
          if (result.needsClarification) {
            grade.ambiguousMatches = result.matches.map((m) => ({ id: m.id, name: m.name }));
          }
          grades.push(grade);
          break;
        }
      }
    }
  }

  return grades;
}

// ──────────────────────────────
// Entity Extraction — Attendance
// ──────────────────────────────

const STATUS_MAP: Record<string, AttendanceStatus> = {
  hadir: 'HADIR',
  izin: 'IZIN',
  ijin: 'IZIN',
  sakit: 'SAKIT',
  alpa: 'ALPA',
  alfa: 'ALPA',
  'tidak hadir': 'ALPA',
  absen: 'ALPA',
  bolos: 'ALPA',
};

function extractAttendance(text: string, context: ParseContext): ParsedAttendance | undefined {
  const normalizedText = text.toLowerCase();
  const matchStudent = createStudentMatcher(context.students);

  // Check for "semua hadir" pattern
  const allPresentPattern = /semua hadir/i;
  const isAllPresent = allPresentPattern.test(normalizedText);

  if (!isAllPresent && !/\b(absen|absensi|hadir|izin|sakit|alpa)\b/i.test(normalizedText)) {
    return undefined;
  }

  const result: ParsedAttendance = {
    defaultStatus: isAllPresent ? 'HADIR' : 'HADIR',
    exceptions: [],
  };

  // Extract exceptions: "kecuali Putri izin, Bagas sakit"
  const exceptionPattern = /kecuali\s+(.+)/i;
  const exceptionMatch = normalizedText.match(exceptionPattern);

  if (exceptionMatch) {
    const exceptionsText = exceptionMatch[1];
    // Match: "Nama status" pairs
    const pairPattern = /(\w[\w\s]*?)\s+(hadir|izin|ijin|sakit|alpa|alfa|tidak hadir|bolos)/gi;
    let pairMatch;

    while ((pairMatch = pairPattern.exec(exceptionsText)) !== null) {
      const studentName = pairMatch[1].trim();
      const statusText = pairMatch[2].toLowerCase();
      const status = STATUS_MAP[statusText] || 'ALPA';

      const studentResult = matchStudent(studentName);
      const exception: ParsedAttendance['exceptions'][0] = {
        studentName,
        status,
        confidence: studentResult.matches.length > 0 ? studentResult.matches[0].score : 0,
      };

      if (studentResult.matches.length > 0) {
        exception.matchedStudentId = studentResult.matches[0].id;
        exception.matchedStudentName = studentResult.matches[0].name;
      }
      if (studentResult.needsClarification) {
        exception.ambiguousMatches = studentResult.matches.map((m) => ({ id: m.id, name: m.name }));
      }

      result.exceptions.push(exception);
    }
  } else if (!isAllPresent) {
    // Individual attendance: "Putri izin", "Bagas sakit"
    const individualPattern = /(\w[\w\s]*?)\s+(hadir|izin|ijin|sakit|alpa|alfa)/gi;
    let match;
    while ((match = individualPattern.exec(normalizedText)) !== null) {
      const studentName = match[1].trim();
      const statusText = match[2].toLowerCase();

      // Skip keywords
      if (['absen', 'absensi', 'kelas', 'semua'].includes(studentName.toLowerCase())) continue;

      const status = STATUS_MAP[statusText] || 'HADIR';
      const studentResult = matchStudent(studentName);

      result.exceptions.push({
        studentName,
        status,
        confidence: studentResult.matches.length > 0 ? studentResult.matches[0].score : 0,
        matchedStudentId: studentResult.matches[0]?.id,
        matchedStudentName: studentResult.matches[0]?.name,
        ambiguousMatches: studentResult.needsClarification
          ? studentResult.matches.map((m) => ({ id: m.id, name: m.name }))
          : undefined,
      });
    }
  }

  return result;
}

// ──────────────────────────────
// Entity Extraction — Class & Subject
// ──────────────────────────────

function extractClassName(text: string): string | undefined {
  const match = text.match(/kelas\s+(\d+\s*[A-Za-z])/i);
  return match ? match[1].replace(/\s+/g, '').toUpperCase() : undefined;
}

function extractSubjectName(text: string): string | undefined {
  const subjects = [
    { patterns: [/matematika/i, /mtk/i, /math/i], name: 'Matematika' },
    { patterns: [/bahasa indonesia/i, /b\.?\s?indo/i, /bind/i], name: 'Bahasa Indonesia' },
    { patterns: [/bahasa inggris/i, /b\.?\s?ing/i, /bing/i, /english/i], name: 'Bahasa Inggris' },
    { patterns: [/ipa/i, /ilmu pengetahuan alam/i, /sains/i, /science/i], name: 'IPA' },
    { patterns: [/ips/i, /ilmu pengetahuan sosial/i], name: 'IPS' },
    { patterns: [/pkn/i, /kewarganegaraan/i, /civics/i], name: 'PKN' },
    { patterns: [/seni/i, /seni budaya/i], name: 'Seni Budaya' },
    { patterns: [/pjok/i, /olahraga/i, /penjas/i], name: 'PJOK' },
    { patterns: [/informatika/i, /tik/i, /komputer/i], name: 'Informatika' },
    { patterns: [/agama/i, /pai/i], name: 'Pendidikan Agama Islam' },
  ];

  for (const subject of subjects) {
    for (const pattern of subject.patterns) {
      if (pattern.test(text)) {
        return subject.name;
      }
    }
  }

  return undefined;
}

// ──────────────────────────────
// Entity Extraction — Assignment
// ──────────────────────────────

function extractAssignment(text: string): ParsedAssignment | undefined {
  if (!/\b(tugas|pr|pekerjaan rumah)\b/i.test(text)) return undefined;

  const assignment: ParsedAssignment = {};

  // Extract description (everything after "PR" or "tugas" until "dikumpul/deadline")
  const descMatch = text.match(/(?:tugas|pr|pekerjaan rumah)\s+(.+?)(?:\s*(?:dikumpul|deadline|tenggat))/i);
  if (descMatch) {
    assignment.description = descMatch[1].trim();
  } else {
    const simpleDesc = text.match(/(?:tugas|pr|pekerjaan rumah)\s+(.+)/i);
    if (simpleDesc) {
      assignment.description = simpleDesc[1].trim();
    }
  }

  // Extract due date
  const dayNames: Record<string, number> = {
    senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6, minggu: 0,
  };
  const dayMatch = text.match(/(?:dikumpul|deadline|tenggat)\s*(?:hari\s+)?(\w+)/i);
  if (dayMatch) {
    const dayName = dayMatch[1].toLowerCase();
    if (dayNames[dayName] !== undefined) {
      // Calculate next occurrence of this day
      const now = new Date();
      const targetDay = dayNames[dayName];
      const currentDay = now.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + daysUntil);
      assignment.dueDate = dueDate.toISOString().split('T')[0];
    }
  }

  return assignment;
}

// ──────────────────────────────
// Main Parser Function
// ──────────────────────────────

export function parseVoiceCommand(rawText: string, context: ParseContext): VoiceParseResult {
  const { intent, confidence } = detectIntent(rawText);

  const result: VoiceParseResult = {
    intent,
    confidence,
    rawText,
    entities: {
      className: extractClassName(rawText) || context.className,
      subjectName: extractSubjectName(rawText) || context.subjectName,
    },
    needsClarification: false,
    clarificationOptions: [],
  };

  switch (intent) {
    case 'INPUT_NILAI': {
      const grades = extractGrades(rawText, context);
      result.entities.grades = grades;

      // Check if any grades need clarification
      for (const grade of grades) {
        if (grade.ambiguousMatches && grade.ambiguousMatches.length > 1) {
          result.needsClarification = true;
          result.clarificationOptions!.push({
            type: 'student_disambiguation',
            originalText: grade.studentName,
            options: grade.ambiguousMatches,
          });
        }
      }

      if (grades.length === 0) {
        result.confidence = Math.min(result.confidence, 0.4);
      }
      break;
    }

    case 'INPUT_ABSENSI': {
      const attendance = extractAttendance(rawText, context);
      result.entities.attendance = attendance;

      if (attendance) {
        for (const exc of attendance.exceptions) {
          if (exc.ambiguousMatches && exc.ambiguousMatches.length > 1) {
            result.needsClarification = true;
            result.clarificationOptions!.push({
              type: 'student_disambiguation',
              originalText: exc.studentName,
              options: exc.ambiguousMatches,
            });
          }
        }
      }
      break;
    }

    case 'BUAT_TUGAS': {
      const assignment = extractAssignment(rawText);
      result.entities.assignment = assignment;
      break;
    }

    case 'UNDO': {
      // No additional entities needed
      result.confidence = 0.95;
      break;
    }
  }

  return result;
}

// Re-export for convenience
export type { VoiceParseResult as ParseResult };
