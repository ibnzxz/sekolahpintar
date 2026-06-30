import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../constants';
import { TrendingUp, CheckCircle2, AlertOctagon } from 'lucide-react-native';

interface RiskStudent {
  name: string;
  class: string;
  issue: string;
}

const DEFAULT_RISK_STUDENTS = [
  { name: 'Putri Wulandari', class: '7A', issue: 'Absensi rendah (82.1%)' },
  { name: 'Keysha Amelia', class: '7B', issue: 'Nilai di bawah KKM (64.2)' },
];

export default function AnalyticsScreen() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const { token, user } = useAuthStore();
  const activeEmail = user?.email || 'budi@sekolahpintar.id';

  const [avgGrade, setAvgGrade] = useState<string>('78.6');
  const [avgAttendance, setAvgAttendance] = useState<string>('95.4%');
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      if (!token || token === 'mock-token') {
        if (activeEmail === 'budi@sekolahpintar.id') {
          setAvgGrade('78.6');
          setAvgAttendance('95.4%');
          setRiskStudents(DEFAULT_RISK_STUDENTS);
        } else {
          setAvgGrade('0.0');
          setAvgAttendance('100%');
          setRiskStudents([]);
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/analytics/overview`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await response.json();
        if (json.success && json.data) {
          const stats = json.data;
          setAvgGrade(stats.averageGrade ? stats.averageGrade.toFixed(1) : '0.0');
          setAvgAttendance(stats.attendanceRate ? stats.attendanceRate.toFixed(1) + '%' : '100%');
          
          const mappedRisk = stats.studentsAtRisk.map((s: any) => {
            let label = s.reason;
            if (s.reason === 'Absensi rendah') {
              label = `Absensi rendah (${s.attendanceRate.toFixed(1)}%)`;
            } else if (s.reason === 'Nilai di bawah rata-rata' || s.reason === 'Nilai di bawah KKM') {
              label = `Nilai di bawah KKM (${s.averageGrade.toFixed(1)})`;
            }
            return {
              name: s.studentName,
              class: s.className,
              issue: label,
            };
          });
          setRiskStudents(mappedRisk);
        }
      } catch (e) {
        console.warn("Failed to load analytics from API, using mock fallback.");
        if (activeEmail === 'budi@sekolahpintar.id') {
          setAvgGrade('78.6');
          setAvgAttendance('95.4%');
          setRiskStudents(DEFAULT_RISK_STUDENTS);
        } else {
          setAvgGrade('0.0');
          setAvgAttendance('100%');
          setRiskStudents([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [token, activeEmail]);

  return (
    <ScrollView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#128c7e" />
        </View>
      ) : (
        <>
          {/* Overview stats cards */}
          <View style={styles.grid}>
            <View style={[styles.statCard, isDark ? styles.cardDark : styles.cardLight]}>
              <TrendingUp size={22} color="#128c7e" />
              <Text style={[styles.statValue, isDark ? styles.textDark : styles.textLight]}>{avgGrade}</Text>
              <Text style={styles.statLabel}>Rata-rata Nilai Siswa</Text>
            </View>

            <View style={[styles.statCard, isDark ? styles.cardDark : styles.cardLight]}>
              <CheckCircle2 size={22} color="#10b981" />
              <Text style={[styles.statValue, isDark ? styles.textDark : styles.textLight]}>{avgAttendance}</Text>
              <Text style={styles.statLabel}>Rata-rata Kehadiran</Text>
            </View>
          </View>

          {/* At risk list card */}
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, { marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertOctagon size={18} color="#ef4444" />
              <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                Siswa Butuh Perhatian (At-Risk)
              </Text>
            </View>

            {riskStudents.length === 0 ? (
              <View style={styles.emptyCenter}>
                <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: 6 }} />
                <Text style={[styles.emptyText, isDark ? styles.textDark : styles.textLight]}>
                  Semua siswa aman! Tidak ada siswa berisiko rendah.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {riskStudents.map((item, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.itemRow, 
                      idx < riskStudents.length - 1 && (isDark ? styles.dividerDark : styles.dividerLight)
                    ]}
                  >
                    <View>
                      <Text style={[styles.studentName, isDark ? styles.textDark : styles.textLight]}>{item.name}</Text>
                      <Text style={styles.studentClass}>Kelas {item.class}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.issue}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  bgLight: {
    backgroundColor: '#f0f2f5',
  },
  bgDark: {
    backgroundColor: '#0b141a',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e9edef',
  },
  cardDark: {
    backgroundColor: '#1f2c34',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8696a0',
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    flexDirection: 'column',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dividerLight: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  dividerDark: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 12,
    color: '#8696a0',
  },
  badge: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  center: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCenter: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8696a0',
    textAlign: 'center',
  },
});
