import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { Mic, Send, X, Volume2 } from 'lucide-react-native';

interface VoiceInputProps {
  onParse: (text: string) => void;
  onClose: () => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onParse, onClose }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [status, setStatus] = useState<string>('Memulai mikrofon...');
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';
  const hasStartedRef = React.useRef(false);

  const handleStartRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID'; // Bahasa Indonesia
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
          setStatus('🎤 Sedang mendengarkan suara Anda... Silakan bicara.');
        };

        recognition.onerror = (event: any) => {
          setIsRecording(false);
          setStatus('Gagal mendengar suara: ' + (event.error === 'not-allowed' ? 'Izin Mic Ditolak' : event.error));
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setStatus(`Berhasil merekam: "${transcript}"`);
          onParse(transcript);
        };

        recognition.start();
        return;
      } catch (e) {
        console.error('Speech recognition error:', e);
      }
    }

    // Fallback Simulator if Web Speech API is not supported
    setIsRecording(true);
    setStatus('Mendengarkan suara Anda...');
    setTimeout(() => {
      setIsRecording(false);
      setStatus('Selesai merekam.');
      if (!inputText) {
        setInputText('nilai Kenzo 90');
        setStatus('Berhasil merekam: "nilai Kenzo 90"');
        onParse('nilai Kenzo 90');
      }
    }, 2000);
  };

  React.useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      handleStartRecording();
    }
  }, []);

  const handleSend = () => {
    if (inputText.trim()) {
      onParse(inputText);
      setInputText('');
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Volume2 size={16} color={isDark ? '#e9edef' : '#1f2c34'} />
          <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>Input Suara (Dual-Mode)</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={18} color={isDark ? '#8696a0' : '#8696a0'} />
        </TouchableOpacity>
      </View>

      {/* Simulator text field */}
      <View style={styles.simContainer}>
        <Text style={styles.simLabel}>Simulator Teks (Ketik perintah di sini untuk uji coba):</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            value={inputText}
            onChangeText={setInputText}
            placeholder='Contoh: "nilai Kenzo 90" atau "absen semua hadir kecuali Putri izin"'
            placeholderTextColor="#8696a0"
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { opacity: inputText ? 1 : 0.5 }]} 
            onPress={handleSend}
            disabled={!inputText}
          >
            <Send size={18} color="#005c4b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Waveform / Voice area */}
      <View style={styles.voiceSection}>
        <Text style={[styles.statusText, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
          {status}
        </Text>

        {isRecording ? (
          <View style={styles.recordingIndicator}>
            <ActivityIndicator size="small" color="var(--accent-teal)" />
            <Text style={{ color: 'var(--accent-teal)', fontSize: 13, fontWeight: '500' }}>
              🔴 PEREKAM AKTIF
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.micBtn, isDark ? styles.micBtnDark : styles.micBtnLight]}
            onPress={handleStartRecording}
          >
            <Mic size={28} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  containerLight: {
    backgroundColor: '#f0f2f5',
    borderColor: '#e9edef',
  },
  containerDark: {
    backgroundColor: '#1f2c34',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  textLight: {
    color: '#1f2c34',
  },
  textDark: {
    color: '#e9edef',
  },
  simContainer: {
    marginBottom: 16,
  },
  simLabel: {
    fontSize: 11,
    color: '#8696a0',
    marginBottom: 6,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e9edef',
    color: '#000000',
  },
  inputDark: {
    backgroundColor: '#2a3942',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  textSecondaryLight: {
    color: '#667781',
  },
  textSecondaryDark: {
    color: '#8696a0',
  },
  micBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  micBtnLight: {
    backgroundColor: '#25d366',
  },
  micBtnDark: {
    backgroundColor: '#00a884',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 60,
  },
});
