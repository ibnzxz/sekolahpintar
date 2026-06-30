import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

interface ConfirmBubbleProps {
  parsedText: string;
  previewDetails: string;
  isAmbiguous?: boolean;
  ambiguousOptions?: Array<{ id: string; name: string }>;
  onConfirm: () => void;
  onCancel: () => void;
  onResolveAmbiguity?: (id: string, name: string) => void;
  assessmentTitle?: string;
}

export const ConfirmBubble: React.FC<ConfirmBubbleProps> = ({
  parsedText,
  previewDetails,
  isAmbiguous = false,
  ambiguousOptions = [],
  onConfirm,
  onCancel,
  onResolveAmbiguity,
  assessmentTitle,
}) => {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
        🔊 Hasil Transkripsi Perintah:
      </Text>
      <Text style={styles.rawText}>"{parsedText}"</Text>
      
      <View style={styles.divider} />

      {isAmbiguous ? (
        <View>
          <Text style={[styles.details, { color: '#ffc107', fontWeight: '600' }]}>
            ❓ Nama Siswa Ambigu. Silakan Pilih Siswa yang Dimaksud:
          </Text>
          <View style={styles.optionRow}>
            {ambiguousOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionBtn, isDark ? styles.optionBtnDark : styles.optionBtnLight]}
                onPress={() => onResolveAmbiguity?.(opt.id, opt.name)}
              >
                <Text style={[styles.optionBtnText, isDark ? styles.textDark : styles.textLight]}>{opt.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View>
          {assessmentTitle && (
            <Text style={[styles.assessmentTitleLabel, isDark ? styles.textDark : styles.textLight]}>
              🎯 Indikator: <Text style={{ fontWeight: '700', color: '#00a884' }}>{assessmentTitle}</Text>
            </Text>
          )}
          <Text style={[styles.details, isDark ? styles.textSecondaryDark : styles.textSecondaryLight, assessmentTitle ? { marginTop: 4 } : null]}>
            {previewDetails}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Ubah</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>Konfirmasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 14,
    padding: 14,
    width: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerLight: {
    backgroundColor: '#fffdf4', // Soft cream/yellowish for draft preview
    borderColor: '#ffe8a3',
  },
  containerDark: {
    backgroundColor: '#262d31', // Darker cream/yellow
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  textLight: {
    color: '#1f2c34',
  },
  textDark: {
    color: '#f0f2f5',
  },
  rawText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#8696a0',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  details: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  textSecondaryLight: {
    color: '#1f2c34',
  },
  textSecondaryDark: {
    color: '#e9edef',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelText: {
    fontSize: 13,
    color: '#667781',
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#00a884', // WhatsApp teal
  },
  confirmText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'column',
    gap: 8,
  },
  optionBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionBtnLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e9edef',
  },
  optionBtnDark: {
    backgroundColor: '#202c33',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  assessmentTitleLabel: {
    fontSize: 13,
    marginBottom: 6,
    color: '#00a884',
  },
});
