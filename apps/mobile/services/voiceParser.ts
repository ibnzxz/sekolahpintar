// ═══════════════════════════════════════════════════
// SekolahPintar Mobile — Client-Side Voice Parser
// ═══════════════════════════════════════════════════

import { Student } from './mockDb';
import Fuse from 'fuse.js';

export interface ParseResult {
  intent: 'INPUT_NILAI' | 'INPUT_ABSENSI' | 'BUAT_TUGAS' | 'UNDO' | 'UNKNOWN';
  rawText: string;
  className?: string;
  subjectName?: string;
  needsClarification: boolean;
  clarificationOptions?: Array<{ id: string; name: string }>;
  tempScore?: number;
  
  // Grade details
  grades?: Array<{
    studentId: string;
    studentName: string;
    score: number;
    originalQuery: string;
  }>;

  // Attendance details
  attendance?: {
    defaultStatus: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
    exceptions: Array<{
      studentId: string;
      studentName: string;
      status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
    }>;
  };

  // Assignment details
  assignment?: {
    description: string;
    dueDate: string;
  };
  assessmentTitle?: string;
}

// Helper to map Indonesian spoken number words to digits
function mapSpokenNumbersToDigits(text: string): string {
  let res = text.toLowerCase();
  
  // Common multi-word numbers
  const mappings: Record<string, string> = {
    'seratus': '100',
    'sembilan puluh': '90',
    'delapan puluh': '80',
    'tujuh puluh': '70',
    'enam puluh': '60',
    'lima puluh': '50',
    'empat puluh': '40',
    'tiga puluh': '30',
    'dua puluh': '20',
    'sepuluh': '10',
    'sebelas': '11',
  };

  // Replace multi-word mappings
  Object.keys(mappings).forEach((key) => {
    const reg = new RegExp(`\\b${key}\\b`, 'g');
    res = res.replace(reg, mappings[key]);
  });

  // Single word units
  const units: Record<string, string> = {
    'sembilan': '9',
    'delapan': '8',
    'tujuh': '7',
    'enam': '6',
    'lima': '5',
    'empat': '4',
    'tiga': '3',
    'dua': '2',
    'satu': '1',
    'nol': '0',
    'kosong': '0',
  };

  // Replaces patterns like "90 5" with "95" or "delapan puluh lima" -> "80 5" -> "85"
  Object.keys(units).forEach((key) => {
    const reg = new RegExp(`\\b${key}\\b`, 'g');
    res = res.replace(reg, units[key]);
  });

  // Combine tens and units (e.g., "90 5" -> "95", "80 2" -> "82")
  res = res.replace(/\b(20|30|40|50|60|70|80|90)\s*([1-9])\b/g, (match, tens, unit) => {
    return String(parseInt(tens, 10) + parseInt(unit, 10));
  });

  // Map Indonesian ordinal/number words to digits
  res = res
    .replace(/\b(pertama|kesatu)\b/gi, '1')
    .replace(/\b(kedua)\b/gi, '2')
    .replace(/\b(ketiga)\b/gi, '3')
    .replace(/\b(keempat)\b/gi, '4')
    .replace(/\b(kelima)\b/gi, '5');

  return res;
}

export function parseVoiceInput(text: string, students: Student[], existingColumns?: string[]): ParseResult {
  // 1. Normalize spacing and spoken numbers
  let tempText = text.replace(/\s+/g, ' ');
  tempText = mapSpokenNumbersToDigits(tempText);

  // Split merged indicator and score (e.g. PR 199 -> PR 1 99)
  tempText = tempText.replace(/\b(pr|uh|tugas|ulangan harian|ulangan)\s*(\d)(\d{2,3})\b/gi, '$1 $2 $3');

  // Split merged digits and letters (e.g. "2nz" -> "2 nz", "uh1" -> "uh 1")
  const processedText = tempText
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2')
    .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');

  const normalized = processedText.toLowerCase().trim();
  
  // Setup fuzzy matching for students
  const fuseItems = students.flatMap(s => [
    { id: s.id, name: s.fullName, original: s },
    { id: s.id, name: s.nickname, original: s }
  ]);
  const fuse = new Fuse(fuseItems, {
    keys: ['name'],
    threshold: 0.4
  });

  const findStudent = (query: string) => {
    const cleaned = query.trim();
    if (!cleaned) return null;
    const res = fuse.search(cleaned);
    if (res.length === 0) return null;
    return res[0].item.original;
  };

  // ═══════════════════════════════════════════════════
  // 1. UNDO INTENT
  // ═══════════════════════════════════════════════════
  if (/\b(batalkan|batal|undo|kembalikan|hapus)\b/i.test(normalized)) {
    return {
      intent: 'UNDO',
      rawText: text,
      needsClarification: false,
    };
  }

  // ═══════════════════════════════════════════════════
  // 2. ATTENDANCE INTENT
  // ═══════════════════════════════════════════════════
  const isAttendanceText = /\b(absen|absensi|hadir|izin|sakit|alpa|alfa|tidak hadir|tidak masuk|bolos)\b/i.test(normalized);
  if (isAttendanceText) {
    const exceptions: any[] = [];
    
    // Status keyword mapper
    const getStatus = (word: string): 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA' | null => {
      const w = word.toLowerCase();
      if (w.includes('izin') || w.includes('ijin')) return 'IZIN';
      if (w.includes('sakit')) return 'SAKIT';
      if (w.includes('alpa') || w.includes('alfa') || w.includes('bolos') || w.includes('tidak masuk') || w.includes('tidak hadir') || w.includes('absen')) return 'ALPA';
      if (w.includes('hadir') || w.includes('masuk')) return 'HADIR';
      return null;
    };

    // Try splitting by common delimiters (commas, "dan", semicolons) to handle multiple student updates
    const clauses = normalized.split(/[,;]|\bdan\b/);
    clauses.forEach((clause) => {
      const words = clause.trim().split(/\s+/);
      
      // Look for a status keyword in this clause
      let foundStatus: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA' | null = null;
      let statusIndex = -1;
      
      for (let i = 0; i < words.length; i++) {
        const s = getStatus(words[i]);
        if (s) {
          foundStatus = s;
          statusIndex = i;
          break;
        }
      }
      
      if (foundStatus && statusIndex >= 0) {
        // The remaining words should be the student name
        const nameWords = [...words];
        nameWords.splice(statusIndex, 1); // remove status word
        
        // Clean filler words from name
        const cleanName = nameWords.join(' ')
          .replace(/\b(absen|absensi|hari ini|kelas|mapel|si|ybs|siswa|murid|kecuali)\b/gi, '')
          .trim();
          
        const student = findStudent(cleanName);
        if (student) {
          exceptions.push({
            studentId: student.id,
            studentName: student.fullName,
            status: foundStatus
          });
        }
      }
    });

    // Fallback: If no exceptions matched via clauses, but we have "kecuali", try the original parser
    if (exceptions.length === 0) {
      const excMatch = normalized.match(/kecuali\s+(.+)/i);
      if (excMatch) {
        const excText = excMatch[1];
        const pairs = excText.split(/[,;]|\bdan\b/);
        
        pairs.forEach(p => {
          const words = p.trim().split(/\s+/);
          if (words.length >= 2) {
            const statusText = words[words.length - 1];
            const studentQuery = words.slice(0, -1).join(' ');
            const status = getStatus(statusText) || 'ALPA';
            const s = findStudent(studentQuery);
            if (s) {
              exceptions.push({
                studentId: s.id,
                studentName: s.fullName,
                status
              });
            }
          }
        });
      }
    }

    return {
      intent: 'INPUT_ABSENSI',
      rawText: text,
      needsClarification: false,
      attendance: {
        defaultStatus: 'HADIR',
        exceptions
      }
    };
  }

  // ═══════════════════════════════════════════════════
  // 3. GRADE INTENT
  // ═══════════════════════════════════════════════════
  const grades: any[] = [];
  
  // Clean indicator names and digits from the text before searching for student name & score
  const cleanForGrades = (t: string) => {
    return t
      .replace(/\b(untuk|nilai|ulangan harian ke-\d+|ulangan harian ke-[a-z]+|ulangan harian pertama|ulangan harian ke satu|ulangan harian|ulangan|tugas|pr|latihan|kuis)\b/gi, '')
      .replace(/\b(matematika|ipa|ips|indonesia|inggris|pjok|seni|agama|sunda|mandarin)\b/gi, '')
      .replace(/\b\d\b/g, '') // strip standalone single digits (indicator indices)
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Support list/multiple inputs: "Budi 80, Ani 90, Candra 95" or "Budi 80 dan Ani 90"
  const items = normalized.split(/[,;]|\bdan\b/);
  
  items.forEach((item) => {
    const cleanedItem = cleanForGrades(item);
    // Find any number between 0 and 100 in the item
    const scoreMatch = cleanedItem.match(/\b(\d{1,3})\b/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      if (score >= 0 && score <= 100) {
        // Strip the score number to get the name query
        const nameQuery = cleanedItem.replace(scoreMatch[0], '').trim();
        // Clean any residual formatting words
        const cleanName = nameQuery
          .replace(/\b(dapat|dapet|diberi|adalah|dikasih|nilainya|nya|si)\b/gi, '')
          .trim();
          
        const student = findStudent(cleanName);
        if (student) {
          grades.push({
            studentId: student.id,
            studentName: student.fullName,
            score,
            originalQuery: cleanName
          });
        }
      }
    }
  });

  if (grades.length > 0) {
    // Handle duplicate Kenzo clarification just in case
    const containsKenzo = grades.some(g => g.originalQuery.toLowerCase() === 'kenzo');
    const hasMultipleKenzos = students.filter(s => s.fullName.toLowerCase().includes('kenzo')).length > 1;

    if (containsKenzo && hasMultipleKenzos) {
      const kenzoOptions = students
        .filter(s => s.fullName.toLowerCase().includes('kenzo'))
        .map(s => ({ id: s.id, name: s.fullName }));

      return {
        intent: 'INPUT_NILAI',
        rawText: text,
        needsClarification: true,
        clarificationOptions: kenzoOptions,
        grades: [],
        tempScore: grades[0]?.score || 100
      };
    }

    // Try to extract assessmentTitle from keywords anywhere in the normalized text
    let assessmentTitle = 'Ulangan Harian 1';
    
    // First map Indonesian word numbers to digits in normalized text for easy matching
    const mappedNormalized = normalized
      .replace(/\b(pertama|kesatu|satu)\b/gi, '1')
      .replace(/\b(kedua|dua)\b/gi, '2')
      .replace(/\b(ketiga|tiga)\b/gi, '3')
      .replace(/\b(keempat|empat)\b/gi, '4')
      .replace(/\b(kelima|lima)\b/gi, '5');

    // Check if it matches any of the existing columns (custom columns included!)
    let matchedExisting = false;
    if (existingColumns && existingColumns.length > 0) {
      // Sort descending by length to match the most specific/longest column name first
      const sortedCols = [...existingColumns].sort((a, b) => b.length - a.length);
      for (const col of sortedCols) {
        const normalizedCol = col.toLowerCase().trim();
        // Also normalize word numbers in col name just in case
        const mappedCol = normalizedCol
          .replace(/\b(pertama|kesatu|satu)\b/gi, '1')
          .replace(/\b(kedua|dua)\b/gi, '2')
          .replace(/\b(ketiga|tiga)\b/gi, '3')
          .replace(/\b(keempat|empat)\b/gi, '4')
          .replace(/\b(kelima|lima)\b/gi, '5');
          
        if (mappedNormalized.includes(mappedCol)) {
          assessmentTitle = col;
          matchedExisting = true;
          break;
        }
      }
    }

    if (!matchedExisting) {
      const hasPR = /\bpr\s*(\d)?\b/i.test(mappedNormalized);
      const hasUH = /\buh\s*(\d)?\b/i.test(mappedNormalized);
      const hasTugas = /\btugas\s*(\d)?\b/i.test(mappedNormalized);
      const hasUlangan = /\bulangan harian\s*(\d)?\b/i.test(mappedNormalized) || /\bulangan\s*(\d)?\b/i.test(mappedNormalized);
      
      if (hasPR) {
        const match = mappedNormalized.match(/\bpr\s*(\d)?\b/i);
        assessmentTitle = match && match[1] ? `PR ${match[1]}` : 'PR 1';
      } else if (hasUH) {
        const match = mappedNormalized.match(/\buh\s*(\d)?\b/i);
        assessmentTitle = match && match[1] ? `Ulangan Harian ${match[1]}` : 'Ulangan Harian 1';
      } else if (hasTugas) {
        const match = mappedNormalized.match(/\btugas\s*(\d)?\b/i);
        assessmentTitle = match && match[1] ? `Tugas ${match[1]}` : 'Tugas 1';
      } else if (hasUlangan) {
        const match = mappedNormalized.match(/\bulangan harian\s*(\d)?\b/i) || mappedNormalized.match(/\bulangan\s*(\d)?\b/i);
        assessmentTitle = match && match[1] ? `Ulangan Harian ${match[1]}` : 'Ulangan Harian 1';
      }
    }

    return {
      intent: 'INPUT_NILAI',
      rawText: text,
      needsClarification: false,
      grades,
      assessmentTitle
    };
  }

  // ═══════════════════════════════════════════════════
  // 4. ASSIGNMENT INTENT (Fallback if no student & score matched)
  // ═══════════════════════════════════════════════════
  if (/\b(tugas|pr|pekerjaan rumah|homework)\b/i.test(normalized)) {
    let description = 'Tugas Baru';
    const descMatch = normalized.match(/(?:tugas|pr|pekerjaan rumah)\s+(.+?)(?:\s*(?:dikumpul|deadline|tenggat|$))/i);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    return {
      intent: 'BUAT_TUGAS',
      rawText: text,
      needsClarification: false,
      assignment: {
        description: description.charAt(0).toUpperCase() + description.slice(1),
        dueDate: 'Jumat, 4 Juli'
      }
    };
  }

  return {
    intent: 'UNKNOWN',
    rawText: text,
    needsClarification: false
  };
}
