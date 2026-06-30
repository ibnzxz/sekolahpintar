import React from 'react';
import { Tabs } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { MessageSquare, Users, Calendar, BarChart2, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';

  const activeColor = isDark ? '#00a884' : '#075e54';
  const inactiveColor = isDark ? '#8696a0' : '#8696a0';
  const barBg = isDark ? '#1f2c34' : '#ffffff';

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: inactiveColor,
      tabBarStyle: {
        backgroundColor: barBg,
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#e9edef',
        height: 70,
        paddingBottom: 12,
        paddingTop: 8,
      },
      headerStyle: {
        backgroundColor: isDark ? '#1f2c34' : '#075e54',
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ruang Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Kolaborasi Guru',
          tabBarLabel: 'Grup',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Jadwal Mengajar',
          tabBarLabel: 'Kalender',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analitik Personal',
          tabBarLabel: 'Analitik',
          tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Pengaturan',
          tabBarLabel: 'Setelan',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
