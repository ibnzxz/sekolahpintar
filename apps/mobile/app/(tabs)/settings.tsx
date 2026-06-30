import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { Moon, Type, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme, fontSize, toggleTheme, setFontSize } = useSettingsStore();
  const { user, logout } = useAuthStore();
  const isDark = theme === 'dark';
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {/* Profile Section */}
      <View style={[styles.profileCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'G'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, isDark ? styles.textDark : styles.textLight]}>
            {user?.fullName || 'Guru Pengajar'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileSchool}>{user?.schoolName}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tampilan & Preferensi</Text>

      {/* Settings Options */}
      <View style={[styles.optionsGroup, isDark ? styles.cardDark : styles.cardLight]}>
        {/* Dark Mode */}
        <View style={styles.optionRow}>
          <View style={styles.optionLabelRow}>
            <Moon size={18} color={isDark ? '#e9edef' : '#111b21'} />
            <Text style={[styles.optionText, isDark ? styles.textDark : styles.textLight]}>Mode Gelap (Dark Mode)</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#00a884' }}
            thumbColor={isDark ? '#00e676' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.divider, isDark ? styles.divDark : styles.divLight]} />

        {/* Font Size Selector */}
        <View style={styles.fontOptionContainer}>
          <View style={[styles.optionLabelRow, { marginBottom: 12 }]}>
            <Type size={18} color={isDark ? '#e9edef' : '#111b21'} />
            <Text style={[styles.optionText, isDark ? styles.textDark : styles.textLight]}>Ukuran Teks (Font Size)</Text>
          </View>
          
          <View style={styles.fontSizeRow}>
            {(['small', 'medium', 'large'] as const).map((size) => {
              const active = fontSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeBtn,
                    active && styles.sizeBtnActive,
                    isDark ? styles.sizeBtnDark : styles.sizeBtnLight
                  ]}
                  onPress={() => setFontSize(size)}
                >
                  <Text style={[
                    styles.sizeBtnText,
                    active && styles.sizeTextActive,
                    { fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 17 },
                    isDark ? styles.textDark : styles.textLight
                  ]}>
                    {size === 'small' ? 'Kecil' : size === 'medium' ? 'Sedang' : 'Besar'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Logout Row */}
      <TouchableOpacity 
        style={[styles.logoutBtn, isDark ? styles.cardDark : styles.cardLight]}
        onPress={handleLogout}
      >
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Keluar dari Aplikasi</Text>
      </TouchableOpacity>
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
  profileCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  profileEmail: {
    fontSize: 13,
    color: '#8696a0',
    marginBottom: 2,
  },
  profileSchool: {
    fontSize: 11,
    color: '#8696a0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8696a0',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  optionsGroup: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  divLight: {
    backgroundColor: '#f0f2f5',
  },
  divDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  fontOptionContainer: {
    flexDirection: 'column',
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  sizeBtnLight: {
    backgroundColor: '#f0f2f5',
    borderColor: '#e9edef',
  },
  sizeBtnDark: {
    backgroundColor: '#2a3942',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sizeBtnActive: {
    borderColor: '#00a884',
    backgroundColor: 'rgba(0, 168, 132, 0.08)',
  },
  sizeBtnText: {
    fontWeight: '600',
  },
  sizeTextActive: {
    color: '#00a884',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },
});
