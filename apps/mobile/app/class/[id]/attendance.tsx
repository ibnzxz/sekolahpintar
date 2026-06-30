import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSettingsStore } from '../../../store/settingsStore';
import { ApiClient } from '../../../services/api';

interface Student {
  id: string;
  fullName: string;
  nickname?: string;
}

export default function ManualAttendanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState<Record<string, 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA'>>({});

  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const detail = await ApiClient.getClassDetail(id);
      if (detail) {
        const loadedStudents = detail.students || [];
        setStudents(loadedStudents);

        // Fetch today's existing attendance from the DB
        const todayStr = new Date().toISOString().split('T')[0];
        const dbAttendance = await ApiClient.getTodayAttendance(id, todayStr);

        const initMap: Record<string, 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA'> = {};
        loadedStudents.forEach((s: Student) => {
          initMap[s.id] = 'HADIR';
        });

        // Override with DB values if exist
        if (dbAttendance && dbAttendance.length > 0) {
          dbAttendance.forEach((rec: any) => {
            if (rec.status) {
              initMap[rec.studentId] = rec.status;
            }
          });
        }

        setStatusMap(initMap);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleToggleStatus = (studentId: string, status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA') => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllHadir = () => {
    const newMap: Record<string, 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA'> = {};
    students.forEach((s) => {
      newMap[s.id] = 'HADIR';
    });
    setStatusMap(newMap);
  };

  const handleSave = async () => {
    if (!students.length || !id) return;

    const totalS = students.length;
    const statuses = Object.values(statusMap);
    const hadir = statuses.filter((s) => s === 'HADIR').length;
    const izin = statuses.filter((s) => s === 'IZIN').length;
    const sakit = statuses.filter((s) => s === 'SAKIT').length;
    const alpa = statuses.filter((s) => s === 'ALPA').length;

    // List exceptions (those who are not HADIR)
    const exceptions: string[] = [];
    students.forEach((student) => {
      const status = statusMap[student.id];
      if (status !== 'HADIR') {
        const capitalStatus = status.charAt(0) + status.slice(1).toLowerCase();
        exceptions.push(`${student.fullName} (${capitalStatus})`);
      }
    });

    const excSummary = exceptions.length > 0 ? `\nKecuali: ${exceptions.join(', ')}` : '';

    await ApiClient.addClassActivity(id, {
      actionType: 'INPUT_ABSENSI',
      inputMethod: 'MANUAL',
      summary: `📋 Absensi (manual)\n✅ ${hadir} hadir | 📝 ${izin} izin | 🏥 ${sakit} sakit | ❌ ${alpa} alpa${excSummary}`,
      detailData: { attendance: statusMap }
    });

    router.back();
  };

  const renderStudentRow = ({ item, index }: { item: Student; index: number }) => {
    const currentStatus = statusMap[item.id] || 'HADIR';

    const renderToggleOption = (label: string, value: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA', activeBg: string) => {
      const active = currentStatus === value;
      return (
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            active ? { backgroundColor: activeBg, borderColor: activeBg } : (isDark ? styles.btnInactiveDark : styles.btnInactiveLight),
          ]}
          onPress={() => handleToggleStatus(item.id, value)}
        >
          <Text style={[styles.toggleText, active ? { color: '#ffffff' } : (isDark ? styles.textDark : styles.textLight)]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={[styles.row, isDark ? styles.borderDark : styles.borderLight]}>
        <View style={{ flex: 1.2 }}>
          <Text style={[styles.studentName, isDark ? styles.textDark : styles.textLight]}>{item.fullName}</Text>
          <Text style={styles.nickname}>Panggilan: {item.nickname}</Text>
        </View>

        <View style={styles.toggleRow}>
          {renderToggleOption('H', 'HADIR', '#10b981')}
          {renderToggleOption('I', 'IZIN', '#3b82f6')}
          {renderToggleOption('S', 'SAKIT', '#f59e0b')}
          {renderToggleOption('A', 'ALPA', '#ef4444')}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {/* Bulk actions */}
      <View style={[styles.bulkSection, isDark ? styles.cardDark : styles.cardLight]}>
        <TouchableOpacity style={styles.bulkHadirBtn} onPress={handleMarkAllHadir}>
          <Text style={styles.bulkHadirText}>✅ Tandai Semua Hadir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentRow}
        contentContainerStyle={styles.list}
      />

      {/* Footer Save */}
      <View style={[styles.footer, isDark ? styles.footerDark : styles.footerLight]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Simpan Presensi</Text>
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
  bulkSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9edef',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLight: {
    backgroundColor: '#ffffff',
  },
  cardDark: {
    backgroundColor: '#1f2c34',
  },
  bulkHadirBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
  },
  bulkHadirText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  borderLight: {
    borderBottomColor: '#e9edef',
    backgroundColor: '#ffffff',
  },
  borderDark: {
    borderBottomColor: 'rgba(255,255,255,0.04)',
    backgroundColor: '#1f2c34',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  nickname: {
    fontSize: 12,
    color: '#8696a0',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInactiveLight: {
    backgroundColor: '#f0f2f5',
    borderColor: '#e9edef',
  },
  btnInactiveDark: {
    backgroundColor: '#2a3942',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
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
