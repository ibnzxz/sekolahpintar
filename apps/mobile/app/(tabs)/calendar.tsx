import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../constants';
import { Clock, BookOpen, AlertTriangle } from 'lucide-react-native';

interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  title: string;
  desc: string;
  isAlert?: boolean;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: 's1', day: 'Senin', time: '07:30 - 09:00', title: 'Matematika — Kelas 7A', desc: 'Materi: Persamaan Linear Satu Variabel' },
  { id: 's2', day: 'Senin', time: '09:15 - 10:45', title: 'Matematika — Kelas 8A', desc: 'Materi: Teorema Pythagoras' },
  { id: 's3', day: 'Rabu', time: '07:30 - 09:00', title: 'Matematika — Kelas 7A', desc: 'Materi: Latihan Soal Aljabar' },
  { id: 's4', day: 'Jumat', time: '13:00 - 15:00', title: 'Rapat Kurikulum', desc: 'Ruang Rapat Utama (Wajib Hadir)', isAlert: true },
];

export default function CalendarScreen() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const { token, user } = useAuthStore();
  const activeEmail = user?.email || 'budi@sekolahpintar.id';

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      if (!token || token === 'mock-token') {
        if (activeEmail === 'budi@sekolahpintar.id') {
          setSchedule(DEFAULT_SCHEDULE);
        } else {
          setSchedule([]);
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/schedule`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await response.json();
        if (json.success && json.data) {
          const mapped: ScheduleItem[] = json.data.map((item: any) => {
            let day = 'Hari';
            let time = '00:00';

            if (item.isRecurring && item.scheduleDay) {
              const dayStr = item.scheduleDay.toLowerCase();
              day = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
              time = `${item.startTime} - ${item.endTime}`;
            } else if (item.startTime) {
              const date = new Date(item.startTime);
              const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              day = days[date.getDay()];
              
              const start = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              let end = '';
              if (item.endTime) {
                const endDate = new Date(item.endTime);
                end = ' - ' + endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              }
              time = start + end;
            }

            return {
              id: item.id,
              day,
              time,
              title: item.title,
              desc: item.description || 'Kegiatan sekolah',
              isAlert: item.eventType === 'RAPAT' || item.eventType === 'ULANGAN',
            };
          });
          setSchedule(mapped);
        }
      } catch (e) {
        console.warn("Failed to load schedule from API, using mock fallback.");
        setSchedule(activeEmail === 'budi@sekolahpintar.id' ? DEFAULT_SCHEDULE : []);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [token, activeEmail]);

  return (
    <ScrollView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>Jadwal Mengajar & Kegiatan</Text>
        <Text style={styles.subtext}>Tahun Ajaran 2025/2026 (Semester Genap)</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#128c7e" />
        </View>
      ) : schedule.length === 0 ? (
        <View style={styles.center}>
          <AlertTriangle size={32} color="#8696a0" style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyText, isDark ? styles.descDark : styles.descLight]}>
            Belum ada jadwal mengajar atau kegiatan terjadwal.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {schedule.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.card, 
                isDark ? styles.cardDark : styles.cardLight,
                item.isAlert && styles.alertCard
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.timeRow}>
                  <Clock size={14} color={item.isAlert ? '#ef4444' : '#128c7e'} />
                  <Text style={[styles.timeText, item.isAlert ? { color: '#ef4444' } : { color: '#128c7e' }]}>
                    {item.day}, {item.time}
                  </Text>
                </View>
                {item.isAlert && <AlertTriangle size={16} color="#ef4444" />}
              </View>

              <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>{item.title}</Text>
              <Text style={[styles.cardDesc, isDark ? styles.descDark : styles.descLight]}>{item.desc}</Text>
            </View>
          ))}
        </View>
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
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    color: '#8696a0',
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  card: {
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
  alertCard: {
    borderColor: '#fca5a5',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  descLight: {
    color: '#667781',
  },
  descDark: {
    color: '#8696a0',
  },
  center: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
