import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { Users, Plus } from 'lucide-react-native';

import { useRouter } from 'expo-router';

interface TeacherGroup {
  id: string;
  name: string;
  desc: string;
  lastMessage: string;
  time: string;
}

const INITIAL_GROUPS: TeacherGroup[] = [
  { id: 'g1', name: 'MGMP Matematika', desc: 'Musyawarah Guru Matematika', lastMessage: 'Rina: Silakan unggah RPP minggu ini rekan-rekan...', time: '11:45' },
  { id: 'g2', name: 'Rapat Kurikulum', desc: 'Rapat dan koordinasi modul ajar', lastMessage: 'Kepsek: Rapat besok diundur ke jam 13:00 ya', time: 'Kemarin' },
  { id: 'g3', name: 'Umum & Tata Usaha', desc: 'Pengumuman dan administrasi umum', lastMessage: 'TU: Batas akhir pengisian Dapodik adalah Jumat...', time: '26 Jun' },
];

function getStored<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

function setStored<T>(key: string, data: T) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export default function GroupsScreen() {
  const router = useRouter();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const { user } = useAuthStore();
  const activeEmail = user?.email || 'budi@sekolahpintar.id';

  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');

  useEffect(() => {
    loadGroups();
  }, [activeEmail]);

  const loadGroups = () => {
    const key = 'sp_mobile_groups_' + activeEmail;
    const stored = getStored<TeacherGroup[]>(key, INITIAL_GROUPS);
    setGroups(stored);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: TeacherGroup = {
      id: 'g_' + Date.now(),
      name: newGroupName.trim(),
      desc: newGroupDesc.trim() || 'Grup koordinasi guru',
      lastMessage: 'Anda: Grup baru berhasil dibuat!',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const key = 'sp_mobile_groups_' + activeEmail;
    const updated = [newGroup, ...groups];
    setStored(key, updated);
    setGroups(updated);

    // Reset fields
    setNewGroupName('');
    setNewGroupDesc('');
    setIsModalOpen(false);
  };

  const renderGroupItem = ({ item }: { item: TeacherGroup }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, isDark ? styles.borderDark : styles.borderLight]}
      onPress={() => router.push('/group/' + item.id)}
    >
      <View style={styles.avatar}>
        <Users size={20} color="#ffffff" />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>{item.name}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={[styles.subtitle, isDark ? styles.subDark : styles.subLight]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupItem}
        contentContainerStyle={styles.list}
      />

      {/* Floating Action Button for Creating Group */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.modalBgDark : styles.modalBgLight]}>
            <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
              Buat Grup Baru
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark ? styles.subDark : styles.subLight]}>
                Nama Grup
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="Contoh: Panitia 17 Agustus"
                placeholderTextColor="#8696a0"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark ? styles.subDark : styles.subLight]}>
                Deskripsi
              </Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="Tulis deskripsi atau tujuan grup..."
                placeholderTextColor="#8696a0"
                value={newGroupDesc}
                onChangeText={setNewGroupDesc}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnCancel]} 
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, styles.btnConfirm]} 
                onPress={handleCreateGroup}
              >
                <Text style={styles.btnConfirmText}>Buat Grup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  bgLight: {
    backgroundColor: '#ffffff',
  },
  bgDark: {
    backgroundColor: '#0b141a',
  },
  list: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  borderLight: {
    borderBottomColor: '#f0f2f5',
  },
  borderDark: {
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#128c7e', // Teal theme matching WhatsApp
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  timeText: {
    fontSize: 11,
    color: '#8696a0',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 16,
  },
  subLight: {
    color: '#667781',
  },
  subDark: {
    color: '#8696a0',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#128c7e', // Floating button matching WA style
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  modalBgLight: {
    backgroundColor: '#ffffff',
  },
  modalBgDark: {
    backgroundColor: '#1f2c34',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  inputLight: {
    borderColor: '#e9edef',
    backgroundColor: '#f8fafc',
    color: '#111b21',
  },
  inputDark: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#2a3942',
    color: '#e9edef',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'transparent',
  },
  btnCancelText: {
    color: '#8696a0',
    fontWeight: '600',
  },
  btnConfirm: {
    backgroundColor: '#128c7e',
  },
  btnConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
