import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { ApiClient } from '../../services/api';
import { ChatBubble } from '../../components/ChatBubble';
import { VoiceInput } from '../../components/VoiceInput';
import { ConfirmBubble } from '../../components/ConfirmBubble';
import { parseVoiceInput, ParseResult } from '../../services/voiceParser';
import { Mic, Table, CheckSquare, Plus, Undo, ArrowLeft } from 'lucide-react-native';

export default function ClassChatRoomScreen() {
  const { id, classSubjectId } = useLocalSearchParams<{ id: string, classSubjectId?: string }>();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Drawer & Draft states
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [parsedDraft, setParsedDraft] = useState<ParseResult | null>(null);
  const [existingColumns, setExistingColumns] = useState<string[]>([]);
  const [activeClassSubjectId, setActiveClassSubjectId] = useState<string>('');
  
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadRoom();
  }, [id]);

  const loadRoom = async () => {
    if (!id) return;
    const detail = await ApiClient.getClassDetail(id);
    if (detail) {
      setClassInfo(detail);

      // Load existing columns for the active subject to enable custom columns voice recognition
      const activeSubId = classSubjectId || detail.subjects?.[0]?.id;
      setActiveClassSubjectId(activeSubId || '');
      
      if (activeSubId) {
        const dbEntries = await ApiClient.getClassSubjectGrades(activeSubId);
        const templateColumns = ['PR 1', 'PR 2', 'Ulangan Harian 1', 'Ulangan Harian 2', 'Tugas 1', 'Tugas 2', 'STS'];
        const cols = [...templateColumns];
        if (dbEntries && dbEntries.length > 0) {
          dbEntries.forEach((entry: any) => {
            if (!cols.some(c => c.toLowerCase() === entry.title.toLowerCase())) {
              cols.push(entry.title);
            }
          });
        }
        setExistingColumns(cols);
      }
    }
    const activityData = await ApiClient.getClassActivity(id);
    setActivities(activityData || []);
  };

  // Voice Parse handler
  const handleParse = (text: string) => {
    if (!classInfo) return;
    const result = parseVoiceInput(text, classInfo.students, existingColumns);
    setParsedDraft(result);
    setIsVoiceOpen(false); // Close voice input overlay to show draft
  };

  // Confirm and save parsed draft
  const handleConfirmDraft = async () => {
    console.log('handleConfirmDraft clicked. id:', id, 'classInfo:', !!classInfo, 'parsedDraft:', !!parsedDraft);
    if (!parsedDraft || !classInfo || !id) {
      alert('Gagal mengkonfirmasi: Data tidak lengkap (id/classInfo/parsedDraft).');
      return;
    }

    if (parsedDraft.intent === 'INPUT_NILAI' && parsedDraft.grades) {
      const studentCount = parsedDraft.grades.length;
      const scores = parsedDraft.grades.map(g => g.score);
      const avg = scores.reduce((a, b) => a + b, 0) / studentCount;
      const roundedAvg = Math.round(avg * 10) / 10;
      
      const title = parsedDraft.assessmentTitle || 'Nilai Ulangan Harian';
      const subjectName = classInfo.subjects?.[0]?.subjectName || 'Mata Pelajaran';

      const classSubjectId = classInfo.subjects?.[0]?.id;

      await ApiClient.addClassActivity(id, {
        actionType: 'INPUT_NILAI',
        inputMethod: 'VOICE',
        summary: `📊 ${title} — ${subjectName} (via suara)\n${studentCount} siswa dinilai\nRata-rata: ${roundedAvg}`,
        detailData: { 
          grades: parsedDraft.grades,
          assessmentTitle: title,
          classSubjectId
        }
      });
    } 
    else if (parsedDraft.intent === 'INPUT_ABSENSI' && parsedDraft.attendance) {
      const totalS = classInfo.students.length;
      const exc = parsedDraft.attendance.exceptions;
      const hadirCount = totalS - exc.length;
      const izinCount = exc.filter(e => e.status === 'IZIN').length;
      const sakitCount = exc.filter(e => e.status === 'SAKIT').length;
      const alpaCount = exc.filter(e => e.status === 'ALPA').length;

      const excLabels = exc.map(e => `${e.studentName} (${e.status})`).join(', ');
      const exceptionsText = excLabels ? `\nKecuali: ${excLabels}` : '';

      await ApiClient.addClassActivity(id, {
        actionType: 'INPUT_ABSENSI',
        inputMethod: 'VOICE',
        summary: `📋 Absensi (via suara)\n✅ ${hadirCount} hadir | 📝 ${izinCount} izin | 🏥 ${sakitCount} sakit | ❌ ${alpaCount} alpa${exceptionsText}`,
        detailData: { exceptions: exc }
      });
    }
    else if (parsedDraft.intent === 'BUAT_TUGAS' && parsedDraft.assignment) {
      await ApiClient.addClassActivity(id, {
        actionType: 'BUAT_TUGAS',
        inputMethod: 'VOICE',
        summary: `📝 Tugas Baru (via suara)\nPR: ${parsedDraft.assignment.description}\n📅 Kumpul: ${parsedDraft.assignment.dueDate}`,
        detailData: { assignment: parsedDraft.assignment }
      });
    }
    else if (parsedDraft.intent === 'UNDO') {
      // TODO: Undo via API
    }

    console.log('Clearing draft and reloading room');
    setParsedDraft(null);
    loadRoom();
  };

  // Resolve Duplicate name ambiguity by selecting one option
  const handleResolveAmbiguity = (studentId: string, studentName: string) => {
    if (!parsedDraft || !classInfo) return;
    
    // Convert ambiguity to a valid resolved grade entry
    const scoreToUse = parsedDraft.tempScore !== undefined ? parsedDraft.tempScore : 100;
    const resolvedGrades = [
      {
        studentId,
        studentName,
        score: scoreToUse,
        originalQuery: 'Kenzo'
      }
    ];

    setParsedDraft({
      ...parsedDraft,
      needsClarification: false,
      grades: resolvedGrades
    });
  };

  // Undo manual trigger
  const handleManualUndo = () => {
    if (!id) return;
    // TODO: Undo via API
    loadRoom();
  };

  const getPreviewText = (): string => {
    if (!parsedDraft) return '';
    if (parsedDraft.intent === 'INPUT_NILAI' && parsedDraft.grades) {
      return parsedDraft.grades.map(g => `• ${g.studentName}: ${g.score}`).join('\n');
    }
    if (parsedDraft.intent === 'INPUT_ABSENSI' && parsedDraft.attendance) {
      const exc = parsedDraft.attendance.exceptions;
      if (exc.length === 0) return 'Semua siswa hadir.';
      return exc.map(e => `• ${e.studentName}: ${e.status}`).join('\n');
    }
    if (parsedDraft.intent === 'BUAT_TUGAS' && parsedDraft.assignment) {
      return `PR: ${parsedDraft.assignment.description}\nDeadline: ${parsedDraft.assignment.dueDate}`;
    }
    if (parsedDraft.intent === 'UNDO') {
      return 'Membatalkan aksi penginputan nilai/absensi terakhir.';
    }
    return 'Perintah suara tidak dapat di-parse.';
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      {/* Subject Header */}
      <View style={[styles.subHeader, isDark ? styles.subHeaderDark : styles.subHeaderLight]}>
        <Text style={[styles.subHeaderTitle, isDark ? styles.textDark : styles.textLight]}>
          Mata Pelajaran: {classInfo?.subjects?.[0]?.subjectName || '-'} ({classInfo?.subjects?.[0]?.subjectCode || '-'})
        </Text>
        <Text style={styles.subHeaderLabel}>{classInfo?.students?.length || 0} Siswa terdaftar</Text>
      </View>

      {/* Chat scroll */}
      <FlatList
        ref={flatListRef}
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            summary={item.summary}
            createdAt={item.createdAt}
            isOutgoing={item.actionType !== 'UNDO'}
            isSystem={item.actionType === 'UNDO'}
            isUndone={item.isUndone}
          />
        )}
        contentContainerStyle={styles.chatList}
        inverted
      />

      {/* Confirmation layer overlay */}
      {parsedDraft && (
        <ConfirmBubble
          parsedText={parsedDraft.rawText}
          previewDetails={getPreviewText()}
          isAmbiguous={parsedDraft.needsClarification}
          ambiguousOptions={parsedDraft.clarificationOptions}
          onConfirm={handleConfirmDraft}
          onCancel={() => setParsedDraft(null)}
          onResolveAmbiguity={handleResolveAmbiguity}
          assessmentTitle={parsedDraft.assessmentTitle}
        />
      )}

      {/* Bottom Actions Toolbar */}
      <View style={[styles.toolbar, isDark ? styles.toolbarDark : styles.toolbarLight]}>
        <TouchableOpacity 
          style={styles.toolBtn} 
          onPress={() => router.push(`/class/${id}/grades?classSubjectId=${activeClassSubjectId}`)}
        >
          <Table size={20} color={isDark ? '#8696a0' : '#667781'} />
          <Text style={styles.toolLabel}>Nilai</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolBtn} 
          onPress={() => router.push(`/class/${id}/attendance`)}
        >
          <CheckSquare size={20} color={isDark ? '#8696a0' : '#667781'} />
          <Text style={styles.toolLabel}>Absen</Text>
        </TouchableOpacity>

        {/* Mic Circle */}
        <TouchableOpacity 
          style={styles.micCircle} 
          onPress={() => setIsVoiceOpen(true)}
        >
          <Mic size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolBtn} 
          onPress={handleManualUndo}
        >
          <Undo size={20} color={isDark ? '#8696a0' : '#667781'} />
          <Text style={styles.toolLabel}>Batal</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolBtn} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={isDark ? '#8696a0' : '#667781'} />
          <Text style={styles.toolLabel}>Kembali</Text>
        </TouchableOpacity>
      </View>

      {/* Voice drawer overlay */}
      {isVoiceOpen && (
        <VoiceInput
          onParse={handleParse}
          onClose={() => setIsVoiceOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLight: {
    backgroundColor: '#efeae2', // WhatsApp chat light background
  },
  bgDark: {
    backgroundColor: '#0b141a', // WhatsApp dark mode background
  },
  subHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  subHeaderLight: {
    backgroundColor: '#f0f2f5',
    borderColor: '#e9edef',
  },
  subHeaderDark: {
    backgroundColor: '#1f2c34',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  subHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  textLight: {
    color: '#111b21',
  },
  textDark: {
    color: '#e9edef',
  },
  subHeaderLabel: {
    fontSize: 11,
    color: '#8696a0',
    marginTop: 2,
  },
  chatList: {
    padding: 16,
    flexGrow: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderTopWidth: 1,
    paddingHorizontal: 10,
  },
  toolbarLight: {
    backgroundColor: '#f0f2f5',
    borderColor: '#e9edef',
  },
  toolbarDark: {
    backgroundColor: '#1f2c34',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 10,
    color: '#8696a0',
    marginTop: 4,
    fontWeight: '600',
  },
  micCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -25 }],
    zIndex: 10,
  },
});
