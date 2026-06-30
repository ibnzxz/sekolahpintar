import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSettingsStore } from '../../../store/settingsStore';
import { ApiClient } from '../../../services/api';

interface Student {
  id: string;
  fullName: string;
  nickname?: string;
  nis?: string;
}

export default function ManualGradesScreen() {
  const { id, classSubjectId: queryClassSubjectId } = useLocalSearchParams<{ id: string, classSubjectId?: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classSubjectId, setClassSubjectId] = useState<string>('');
 
  const [classDetail, setClassDetail] = useState<any>(null);

  // Excel-like Grid states
  const [indicators, setIndicators] = useState<string[]>([]);
  // Record<IndicatorName, Record<StudentID, Score>>
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  const [focusedIndicator, setFocusedIndicator] = useState<string>('');
 
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const router = useRouter();
 
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const detail = await ApiClient.getClassDetail(id);
      if (detail) {
        setClassDetail(detail);
        setClassName(detail.name);
        const loadedStudents = detail.students || [];
        setStudents(loadedStudents);
         
        // Fetch existing grades from the DB for this class subject (prefer subject-specific classSubjectId param)
        const reqClassSubjectId = queryClassSubjectId || detail.subjects?.[0]?.id;
        let dbEntries: any[] = [];
        if (reqClassSubjectId) {
          setClassSubjectId(reqClassSubjectId);
          dbEntries = await ApiClient.getClassSubjectGrades(reqClassSubjectId);
        }

        // Standard template columns that must ALWAYS exist in the sheet
        const templateColumns = ['PR 1', 'PR 2', 'Ulangan Harian 1', 'Ulangan Harian 2', 'Tugas 1', 'Tugas 2', 'STS'];
        
        // Merge template columns with any unique custom columns from the DB
        const finalIndicators = [...templateColumns];
        if (dbEntries && dbEntries.length > 0) {
          dbEntries.forEach((entry: any) => {
            const exists = finalIndicators.some(c => c.toLowerCase() === entry.title.toLowerCase());
            if (!exists) {
              finalIndicators.push(entry.title);
            }
          });
        }

        // Initialize scores state for all columns
        const initScores: Record<string, Record<string, string>> = {};
        finalIndicators.forEach((ind) => {
          initScores[ind] = {};
          loadedStudents.forEach((s: Student) => {
            initScores[ind][s.id] = '80'; // default score 80
          });
        });

        // Overlay with actual scores from database
        if (dbEntries && dbEntries.length > 0) {
          dbEntries.forEach((entry: any) => {
            // Find the matching indicator column (case-insensitive)
            const matchedInd = finalIndicators.find(c => c.toLowerCase() === entry.title.toLowerCase()) || entry.title;
            
            entry.grades.forEach((g: any) => {
              if (g.score !== null && g.score !== undefined) {
                initScores[matchedInd][g.studentId] = String(g.score);
              }
            });
          });
        }

        setIndicators(finalIndicators);
        setScores(initScores);
        setFocusedIndicator(finalIndicators[0]);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleScoreChange = (indicator: string, studentId: string, val: string) => {
    setScores((prev) => ({
      ...prev,
      [indicator]: {
        ...(prev[indicator] || {}),
        [studentId]: val,
      }
    }));
  };

  const handleAddIndicator = () => {
    const name = window.prompt('Masukkan Nama Indikator Penilaian Baru:', `Penilaian ${indicators.length + 1}`);
    if (!name || !name.trim()) return;

    const trimmed = name.trim();
    if (indicators.includes(trimmed)) {
      alert('Nama indikator sudah digunakan!');
      return;
    }

    const newScores: Record<string, string> = {};
    students.forEach((s) => {
      newScores[s.id] = '80';
    });

    setIndicators((prev) => [...prev, trimmed]);
    setScores((prev) => ({
      ...prev,
      [trimmed]: newScores
    }));
    setFocusedIndicator(trimmed);
  };

  const handleHeaderPress = (indicator: string, index: number) => {
    setFocusedIndicator(indicator);
    const action = window.prompt(
      `Pilihan Kolom "${indicator}":\nKetik "ubah" untuk ganti nama, atau "hapus" untuk menghapus kolom ini:`, 
      'ubah'
    );
    if (!action) return;
    const lower = action.toLowerCase().trim();
    
    if (lower === 'ubah') {
      const newName = window.prompt('Ubah Nama Indikator:', indicator);
      if (newName && newName.trim() && newName.trim() !== indicator) {
        const trimmed = newName.trim();
        if (indicators.includes(trimmed)) {
          alert('Nama indikator sudah digunakan!');
          return;
        }
        setIndicators(prev => {
          const copy = [...prev];
          copy[index] = trimmed;
          return copy;
        });
        setScores(prev => {
          const copy = { ...prev };
          copy[trimmed] = copy[indicator];
          delete copy[indicator];
          return copy;
        });
        setFocusedIndicator(trimmed);
      }
    } else if (lower === 'hapus') {
      if (indicators.length <= 1) {
        alert('Minimal harus ada 1 indikator penilaian!');
        return;
      }
      if (window.confirm(`Apakah Anda yakin ingin menghapus kolom "${indicator}"?`)) {
        setIndicators(prev => prev.filter((_, i) => i !== index));
        setScores(prev => {
          const copy = { ...prev };
          delete copy[indicator];
          return copy;
        });
        // Reset focus to first remaining indicator
        setFocusedIndicator(indicators.filter((_, i) => i !== index)[0] || '');
      }
    }
  };

  const handleSave = async () => {
    if (!students.length || !id || saving) return;

    setSaving(true);
    const studentCount = students.length;

    let payload: any;

    if (indicators.length === 1) {
      // Single Tab Mode
      const indName = indicators[0];
      const indScores = scores[indName] || {};
      const scoreVals = Object.values(indScores).map(s => parseFloat(s) || 0);
      const avg = scoreVals.reduce((a, b) => a + b, 0) / studentCount;
      const roundedAvg = Math.round(avg * 10) / 10;

      payload = {
        actionType: 'INPUT_NILAI',
        inputMethod: 'MANUAL',
        summary: `📊 ${indName} (manual)\n${studentCount} siswa dinilai, rata-rata: ${roundedAvg}`,
        detailData: { 
          grades: indScores,
          assessmentTitle: indName,
          classSubjectId
        }
      };
    } else {
      // Multi Tab Batch Mode
      const batches = indicators.map((indName) => ({
        title: indName,
        grades: scores[indName] || {}
      }));

      const summaryHeader = `📊 Input ${indicators.length} Penilaian (manual)\n`;
      const summaryDetails = indicators.map((indName) => {
        const indScores = scores[indName] || {};
        const scoreVals = Object.values(indScores).map(s => parseFloat(s) || 0);
        const avg = scoreVals.reduce((a, b) => a + b, 0) / studentCount;
        const roundedAvg = Math.round(avg * 10) / 10;
        return `- ${indName} (Rata-rata: ${roundedAvg})`;
      }).join('\n');

      payload = {
        actionType: 'INPUT_NILAI',
        inputMethod: 'MANUAL',
        summary: summaryHeader + summaryDetails,
        detailData: { 
          batches,
          classSubjectId
        }
      };
    }

    // Await the save to prevent "keluar masuk hilang" race condition.
    // Backend optimization makes this take ~4.5s instead of 20s.
    try {
      await ApiClient.addClassActivity(id, payload);
      router.back();
    } catch (e) {
      console.warn("Save failed", e);
      setSaving(false);
      alert('Gagal menyimpan data.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00a884" />
        <Text style={{ color: '#8696a0', marginTop: 12 }}>Memuat lembar penilaian...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {/* ScrollView for Excel-like Grid */}
      <ScrollView style={styles.verticalScroll} contentContainerStyle={{ paddingBottom: 150 }}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
          <View style={styles.table}>
            {/* Table Header Row */}
            <View style={[styles.headerRow, isDark ? styles.headerRowDark : styles.headerRowLight]}>
              <View style={styles.cellNo}>
                <Text style={styles.headerText}>NO</Text>
              </View>
              <View style={styles.cellName}>
                <Text style={styles.headerText}>NAMA SISWA</Text>
              </View>
              <View style={styles.cellNis}>
                <Text style={styles.headerText}>NIS</Text>
              </View>
              
              {/* Dynamic Assessment Columns */}
              {indicators.map((ind, idx) => {
                const isFocused = ind === focusedIndicator;
                return (
                  <TouchableOpacity 
                    key={ind} 
                    style={[
                      styles.cellIndicatorHeader,
                      isFocused && (isDark ? styles.focusedHeaderDark : styles.focusedHeaderLight)
                    ]}
                    onPress={() => handleHeaderPress(ind, idx)}
                  >
                    <Text style={[styles.indicatorHeaderText, isFocused && { color: '#00a884' }]}>{ind}</Text>
                    <Text style={styles.editHint}>{isFocused ? '🟢' : '⚙️'}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Add column button */}
              <TouchableOpacity style={styles.addColCell} onPress={handleAddIndicator}>
                <Text style={styles.addColText}>+ Kolom</Text>
              </TouchableOpacity>
            </View>

            {/* Table Rows (Students) */}
            {students.map((student, index) => {
              const isEven = index % 2 === 0;
              const rowBg = isDark 
                ? (isEven ? '#1f2c34' : '#172227') 
                : (isEven ? '#ffffff' : '#f8f9fa');

              return (
                <View key={student.id} style={[styles.row, { backgroundColor: rowBg }, isDark ? styles.borderDark : styles.borderLight]}>
                  <View style={styles.cellNo}>
                    <Text style={[styles.cellText, isDark ? styles.textDark : styles.textLight]}>{index + 1}</Text>
                  </View>
                  <View style={styles.cellName}>
                    <Text style={[styles.studentNameText, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                      {student.fullName}
                    </Text>
                  </View>
                  <View style={styles.cellNis}>
                    <Text style={[styles.cellText, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                      {student.nis || '-'}
                    </Text>
                  </View>

                  {/* Dynamic Score cells */}
                  {indicators.map((ind) => {
                    const currentScores = scores[ind] || {};
                    const val = currentScores[student.id] || '';
                    const isFocused = ind === focusedIndicator;
                    return (
                      <View 
                        key={ind} 
                        style={[
                          styles.cellScore,
                          isFocused && (isDark ? styles.focusedCellDark : styles.focusedCellLight)
                        ]}
                      >
                        <TextInput
                          style={[styles.gridInput, isDark ? styles.inputDark : styles.inputLight, isFocused && { borderColor: '#00a884' }]}
                          value={val}
                          onChangeText={(text) => handleScoreChange(ind, student.id, text)}
                          onFocus={() => setFocusedIndicator(ind)}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                    );
                  })}

                  {/* Empty cell matching the + Kolom header size */}
                  <View style={styles.addColCellPlaceholder} />
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Footer Save */}
      <View style={[styles.footer, isDark ? styles.footerDark : styles.footerLight]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={saving}>
          <Text style={styles.cancelBtnText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, saving && { backgroundColor: '#8696a0' }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : 'Simpan Nilai'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLight: {
    backgroundColor: '#f0f2f5',
  },
  bgDark: {
    backgroundColor: '#0b141a',
  },
  verticalScroll: {
    flex: 1,
  },
  horizontalScroll: {
    flex: 1,
  },
  table: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#00a884',
    paddingVertical: 10,
  },
  headerRowLight: {
    backgroundColor: '#e1f3ef',
  },
  headerRowDark: {
    backgroundColor: '#1f2c34',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00a884',
    textAlign: 'center',
  },
  indicatorHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8696a0',
    textAlign: 'center',
  },
  editHint: {
    fontSize: 9,
    marginTop: 2,
    color: '#8696a0',
  },
  cellNo: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellName: {
    width: 220,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  cellNis: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellIndicatorHeader: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.06)',
    paddingVertical: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  focusedHeaderLight: {
    backgroundColor: 'rgba(0,168,132,0.1)',
    borderBottomColor: '#00a884',
  },
  focusedHeaderDark: {
    backgroundColor: 'rgba(0,92,75,0.2)',
    borderBottomColor: '#00a884',
  },
  addColCell: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00a884',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingVertical: 6,
    marginHorizontal: 8,
    backgroundColor: 'rgba(0,168,132,0.05)',
  },
  addColText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00a884',
  },
  addColCellPlaceholder: {
    width: 116,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  borderLight: {
    borderBottomColor: '#e9edef',
  },
  borderDark: {
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  cellText: {
    fontSize: 13,
  },
  studentNameText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  textSecondaryLight: {
    color: '#667781',
  },
  textSecondaryDark: {
    color: '#8696a0',
  },
  cellScore: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.04)',
    paddingVertical: 2,
  },
  focusedCellLight: {
    backgroundColor: 'rgba(0,168,132,0.02)',
  },
  focusedCellDark: {
    backgroundColor: 'rgba(0,92,75,0.05)',
  },
  gridInput: {
    width: 60,
    height: 32,
    borderWidth: 1,
    borderRadius: 4,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e9edef',
    color: '#111b21',
  },
  inputDark: {
    backgroundColor: '#2a3942',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#e9edef',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e9edef',
  },
  footerDark: {
    backgroundColor: '#1f2c34',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8696a0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontWeight: '700',
    color: '#8696a0',
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
