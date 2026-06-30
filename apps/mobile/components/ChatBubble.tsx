import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

interface ChatBubbleProps {
  summary: string;
  createdAt: string;
  isOutgoing?: boolean;
  isSystem?: boolean;
  isUndone?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  summary, 
  createdAt, 
  isOutgoing = true, 
  isSystem = false,
  isUndone = false 
}) => {
  const { theme, fontSize } = useSettingsStore();
  const isDark = theme === 'dark';

  // Font presets
  const fontSizes = {
    small: { body: 13, time: 10 },
    medium: { body: 15, time: 11 },
    large: { body: 18, time: 13 },
  };

  const currentFont = fontSizes[fontSize];

  const bubbleStyle = [
    styles.bubble,
    isOutgoing ? (isDark ? styles.outgoingDark : styles.outgoingLight) : (isDark ? styles.incomingDark : styles.incomingLight),
    isSystem && styles.systemBubble,
    isUndone && styles.undoneBubble
  ];

  const textStyle = [
    styles.text,
    { fontSize: currentFont.body },
    isOutgoing ? styles.textOutgoing : (isDark ? styles.textIncomingDark : styles.textIncomingLight),
    isUndone && styles.textUndone
  ];

  const timeStyle = [
    styles.time,
    { fontSize: currentFont.time },
    isOutgoing ? styles.timeOutgoing : styles.timeIncoming
  ];

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.container, isOutgoing ? styles.alignRight : styles.alignLeft]}>
      <View style={bubbleStyle}>
        <Text style={textStyle}>
          {isUndone ? '⚠️ [Dibatalkan]\n' : ''}
          {summary}
        </Text>
        <Text style={timeStyle}>{formatTime(createdAt)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    flexDirection: 'row',
    width: '100%',
  },
  alignRight: {
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  alignLeft: {
    justifyContent: 'flex-start',
    paddingRight: 40,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  outgoingLight: {
    backgroundColor: '#e1f7d5', // WhatsApp-like soft green
    borderTopRightRadius: 2,
  },
  outgoingDark: {
    backgroundColor: '#005c4b', // WhatsApp dark mode green
    borderTopRightRadius: 2,
  },
  incomingLight: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 2,
  },
  incomingDark: {
    backgroundColor: '#202c33',
    borderTopLeftRadius: 2,
  },
  systemBubble: {
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  undoneBubble: {
    opacity: 0.5,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  text: {
    lineHeight: 20,
  },
  textOutgoing: {
    color: '#1f2c34', // Dark dark green/grey
  },
  textIncomingLight: {
    color: '#1f2c34',
  },
  textIncomingDark: {
    color: '#e9edef',
  },
  textUndone: {
    textDecorationLine: 'line-through',
  },
  time: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeOutgoing: {
    color: 'rgba(31, 44, 52, 0.6)',
  },
  timeIncoming: {
    color: '#8696a0',
  },
});
