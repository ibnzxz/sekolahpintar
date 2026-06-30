import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('budi@sekolahpintar.id');
  const [password, setPassword] = useState<string>('guru123');
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const [error, setError] = useState<string>('');

  const handleLogin = async () => {
    setError('');
    const success = await login(email, password);
    if (success) {
      router.replace('/(tabs)');
    } else {
      setError('Email atau password salah');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>🏫</Text>
        </View>
        <Text style={styles.title}>SekolahPintar</Text>
        <Text style={styles.subtitle}>Portal Guru & Pengajar</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email / User ID</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholder="guru@sekolahpintar.id"
            placeholderTextColor="#8696a0"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#8696a0"
          />
        </View>

        {error ? (
          <Text style={{ color: '#ef4444', marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        ) : null}

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Masuk ke Kelas</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>SekolahPintar MVP • Versi 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b141a', // Dark theme by default for login page
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#128c7e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8696a0',
  },
  form: {
    backgroundColor: '#1f2c34',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8696a0',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2a3942',
    color: '#ffffff',
    paddingHorizontal: 16,
    fontSize: 15,
  },
  loginBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: '#667781',
    fontSize: 12,
    marginTop: 40,
  },
});
