import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { ApiClient } from '../services/api';
import { Search } from 'lucide-react-native';

export default function SubjectsListScreen() {
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

  const renderClassItem = ({ item }: { item: any }) => {
    const summary = 'Belum ada aktivitas';
    const rawTime = null;
    
    let timeText = '';
    if (rawTime) {
      try {
        const date = new Date(rawTime);
        timeText = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      } catch {}
    }

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, isDark ? styles.borderDark : styles.borderLight]}
        onPress={() => router.push(`/class/${item.id}?classSubjectId=${item.classSubjectId}`)}
      >
        {/* Avatar badge */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name}</Text>
        </View>

        {/* Text Area */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontSize: currentFont.title }, isDark ? styles.textDark : styles.textLight]}>
              Kelas {item.name} — {item.subjectName}
            </Text>
            {timeText ? (
              <Text style={styles.timeText}>{timeText}</Text>
            ) : null}
          </View>
          <Text 
            style={[styles.subtitle, { fontSize: currentFont.subtitle }, isDark ? styles.subDark : styles.subLight]}
            numberOfLines={1}
          >
            {summary}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Classroom list */}
      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: '#8696a0', fontSize: 14 }}>Kelas tidak ditemukan</Text>
          </View>
        }
      />
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
    borderBottomWidth: 1,
  },
  borderLight: {
    borderBottomColor: '#f0f2f5',
  },
  borderDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontWeight: '600',
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  timeText: {
    fontSize: 12,
    color: '#8696a0',
  },
  subtitle: {
    fontWeight: '400',
  },
  subLight: {
    color: '#667781',
  },
  subDark: {
    color: '#8696a0',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  }
});
