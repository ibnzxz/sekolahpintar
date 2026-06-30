import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { ApiClient } from '../../services/api';
import { Search, Folder } from 'lucide-react-native';

export default function ClassRoomsListScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const { theme, fontSize } = useSettingsStore();
  const isDark = theme === 'dark';
  const router = useRouter();

  // Font presets
  const fontSizes = {
    small: { title: 14, subtitle: 11, header: 18 },
    medium: { title: 16, subtitle: 13, header: 20 },
    large: { title: 19, subtitle: 15, header: 23 },
  };
  const currentFont = fontSizes[fontSize];

  useEffect(() => {
    // Load local classrooms list
    const load = async () => {
      const data = await ApiClient.getMyClasses();
      setClasses(data);
    };
    load();
  }, []);

  // Filter list by search query
  const filteredClasses = classes.filter((c) => {
    return c.name.toLowerCase().includes(search.toLowerCase()) || 
           c.subjectName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {/* Search Header */}
      <View style={[styles.searchBarContainer, isDark ? styles.searchBarDark : styles.searchBarLight]}>
        <Search size={16} color="#8696a0" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
          value={search}
          onChangeText={setSearch}
          placeholder="Cari kelas atau mata pelajaran..."
          placeholderTextColor="#8696a0"
        />
      </View>

      {/* Folder List */}
      <View style={styles.list}>
        <TouchableOpacity 
          style={[styles.itemContainer, isDark ? styles.borderDark : styles.borderLight]}
          onPress={() => router.push(`/subjects`)}
        >
          {/* Avatar badge */}
          <View style={[styles.avatar, { backgroundColor: '#25D366' }]}>
            <Folder color="white" size={24} />
          </View>

          {/* Text Area */}
          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { fontSize: currentFont.title }, isDark ? styles.textDark : styles.textLight]}>
                Mata Pelajaran
              </Text>
            </View>
            <Text 
              style={[styles.subtitle, { fontSize: currentFont.subtitle }, isDark ? styles.subDark : styles.subLight]}
              numberOfLines={1}
            >
              Berisi {classes.length} ruang kelas aktif
            </Text>
          </View>
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
    backgroundColor: '#ffffff',
  },
  bgDark: {
    backgroundColor: '#0b141a',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchBarLight: {
    backgroundColor: '#f0f2f5',
  },
  searchBarDark: {
    backgroundColor: '#1f2c34',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
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
    backgroundColor: '#128c7e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
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
    flex: 1,
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
    lineHeight: 16,
  },
  subLight: {
    color: '#667781',
  },
  subDark: {
    color: '#8696a0',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});
