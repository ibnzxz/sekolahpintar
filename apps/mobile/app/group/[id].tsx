import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Send } from 'lucide-react-native';

interface Message {
  id: string;
  senderName: string;
  senderEmail: string;
  text: string;
  time: string;
  isMe: boolean;
}

const DEFAULT_MESSAGES: Record<string, Message[]> = {
  g1: [
    { id: 'm1', senderName: 'Rina Wulandari, S.Pd.', senderEmail: 'rina@sekolahpintar.id', text: 'Rekan-rekan, silakan unggah RPP Matematika untuk minggu ini ya.', time: '10:15', isMe: false },
    { id: 'm2', senderName: 'Ahmad Fauzi, S.Pd.', senderEmail: 'ahmad@sekolahpintar.id', text: 'Siap Bu Rina, RPP kelas 8 sudah saya rampungkan.', time: '10:30', isMe: false },
    { id: 'm3', senderName: 'Budi Santoso, S.Pd.', senderEmail: 'budi@sekolahpintar.id', text: 'Saya sedang sinkronisasi modul ajar kelas 7, sore ini menyusul.', time: '11:45', isMe: true },
  ],
  g2: [
    { id: 'm4', senderName: 'Ir. Siti Rahayu, M.Pd.', senderEmail: 'admin@sekolahpintar.id', text: 'Rapat kurikulum untuk evaluasi besok diundur ke jam 13:00 ya.', time: 'Kemarin', isMe: false },
    { id: 'm5', senderName: 'Dewi Lestari, S.Pd.', senderEmail: 'dewi@sekolahpintar.id', text: 'Dimengerti Bu Kepsek. Terima kasih infonya.', time: 'Kemarin', isMe: false },
  ],
  g3: [
    { id: 'm6', senderName: 'Tata Usaha (Endang)', senderEmail: 'tu@sekolahpintar.id', text: 'Batas akhir pengisian Dapodik adalah Jumat pukul 14:00. Mohon kerja samanya.', time: '26 Jun', isMe: false },
  ]
};

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

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const { user } = useAuthStore();
  const activeEmail = user?.email || 'budi@sekolahpintar.id';

  const [groupName, setGroupName] = useState<string>('Grup Koordinasi');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    // Load group details from localStorage to get the correct name
    const keyGroups = 'sp_mobile_groups_' + activeEmail;
    const storedGroups = getStored<any[]>(keyGroups, []);
    const matchGroup = storedGroups.find(g => g.id === id);
    if (matchGroup) {
      setGroupName(matchGroup.name);
    } else {
      // Fallback defaults
      const defaults: Record<string, string> = {
        g1: 'MGMP Matematika',
        g2: 'Rapat Kurikulum',
        g3: 'Umum & Tata Usaha',
      };
      setGroupName(defaults[id] || 'Grup Koordinasi');
    }

    // Load messages
    const keyMsg = `sp_mobile_group_msg_${id}_${activeEmail}`;
    const initialMsg = DEFAULT_MESSAGES[id] || [
      { id: 'm_init', senderName: 'Sistem', senderEmail: 'system', text: 'Selamat datang di grup! Silakan mulai obrolan Anda.', time: 'Sekarang', isMe: false }
    ];
    setMessages(getStored<Message[]>(keyMsg, initialMsg));
  }, [id, activeEmail]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !id) return;

    const newMsg: Message = {
      id: 'm_' + Date.now(),
      senderName: user?.fullName || 'Saya',
      senderEmail: activeEmail,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    
    const keyMsg = `sp_mobile_group_msg_${id}_${activeEmail}`;
    setStored(keyMsg, updated);

    // Update last message in the groups list
    const keyGroups = 'sp_mobile_groups_' + activeEmail;
    const storedGroups = getStored<any[]>(keyGroups, []);
    const updatedGroups = storedGroups.map(g => {
      if (g.id === id) {
        return {
          ...g,
          lastMessage: `Anda: ${newMsg.text}`,
          time: newMsg.time
        };
      }
      return g;
    });
    setStored(keyGroups, updatedGroups);

    setInputText('');
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderEmail === activeEmail || item.isMe;

    return (
      <View style={[styles.bubbleWrapper, isCurrentUser ? styles.wrapperRight : styles.wrapperLeft]}>
        <View style={[
          styles.bubble,
          isCurrentUser 
            ? (isDark ? styles.bubbleMeDark : styles.bubbleMeLight)
            : (isDark ? styles.bubbleOtherDark : styles.bubbleOtherLight)
        ]}>
          {!isCurrentUser && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.messageText, isDark ? styles.textDark : styles.textLight]}>
            {item.text}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Custom Header */}
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>Grup Kolaborasi Guru</Text>
        </View>
      </View>

      {/* Messages list */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.list}
        style={{ flex: 1 }}
      />

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputBar, isDark ? styles.inputBarDark : styles.inputBarLight]}>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="Tulis pesan..."
            placeholderTextColor="#8696a0"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity 
            style={styles.sendBtn} 
            onPress={handleSendMessage}
            activeOpacity={0.8}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLight: {
    backgroundColor: '#efeae2', // WhatsApp light background color
  },
  bgDark: {
    backgroundColor: '#0b141a', // WhatsApp dark background color
  },
  header: {
    height: 60,
    backgroundColor: '#075e54',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerLight: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  headerDark: {
    borderBottomWidth: 0,
  },
  backBtn: {
    padding: 6,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
    width: '100%',
  },
  wrapperLeft: {
    justifyContent: 'flex-start',
  },
  wrapperRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  bubbleMeLight: {
    backgroundColor: '#d9fdd3',
    borderTopRightRadius: 2,
  },
  bubbleMeDark: {
    backgroundColor: '#005c4b',
    borderTopRightRadius: 2,
  },
  bubbleOtherLight: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2,
  },
  bubbleOtherDark: {
    backgroundColor: '#202c33',
    borderTopLeftRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  timeText: {
    fontSize: 9,
    color: '#8696a0',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  inputBarLight: {
    backgroundColor: '#f0f2f5',
  },
  inputBarDark: {
    backgroundColor: '#1f2c34',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e9edef',
    color: '#111b21',
  },
  inputDark: {
    backgroundColor: '#2a3942',
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#e9edef',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#128c7e',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
