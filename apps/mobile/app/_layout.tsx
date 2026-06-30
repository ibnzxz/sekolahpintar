import React from 'react';
import { Stack, useRouter, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../store/settingsStore';
import { TouchableOpacity, Platform, View, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { theme } = useSettingsStore();
  const { user, ready, hydrate } = useAuthStore();
  const isDark = theme === 'dark';
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    hydrate();
  }, []);

  // Wait for localStorage restore before deciding
  if (!ready) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#00a884" /></View>;
  }

  // Auth Guard
  const inAuthGroup = segments[0] === '(auth)';
  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1f2c34' : '#075e54',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="subjects" 
          options={{ 
            title: 'Daftar Kelas', 
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ marginLeft: Platform.OS === 'web' ? 16 : 0, marginRight: 16 }}>
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
            )
          }} 
        />
        <Stack.Screen 
          name="class/[id]" 
          options={{ 
            title: 'Ruang Kelas', 
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ marginLeft: Platform.OS === 'web' ? 16 : 0, marginRight: 16 }}>
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
            )
          }} 
        />
        <Stack.Screen name="class/[id]/grades" options={{ 
          title: 'Input Nilai Manual',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ marginLeft: Platform.OS === 'web' ? 16 : 0, marginRight: 16 }}>
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
          )
        }} />
        <Stack.Screen name="class/[id]/attendance" options={{ 
          title: 'Absensi Siswa',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ marginLeft: Platform.OS === 'web' ? 16 : 0, marginRight: 16 }}>
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
          )
        }} />
      </Stack>
    </>
  );
}
