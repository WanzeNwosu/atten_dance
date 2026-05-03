// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as Application from 'expo-application';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const deviceId = Application.androidId || Application.applicationId || 'unknown';
      await login(email.trim().toLowerCase(), password, deviceId);
    } catch (err: any) {
      Alert.alert('Login Failed', err?.error || err?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={S.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={S.inner}>
        <View style={S.logoBox}>
          <Text style={S.logoIcon}>📋</Text>
        </View>
        <Text style={S.title}>AttendX</Text>
        <Text style={S.subtitle}>Smart Attendance Management</Text>

        <View style={S.card}>
          <Text style={S.label}>Email</Text>
          <TextInput
            style={S.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor="#6b7280"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email"
          />
          <Text style={S.label}>Password</Text>
          <TextInput
            style={S.input} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor="#6b7280" secureTextEntry
          />
          <TouchableOpacity style={[S.btn, loading && S.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnText}>Sign In</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={S.linkBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={S.linkText}>Don't have an account? <Text style={S.linkHighlight}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoBox: { width: 64, height: 64, backgroundColor: '#4f46e5', borderRadius: 18, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  logoIcon: { fontSize: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32, marginTop: 4 },
  card: { backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
  label: { fontSize: 13, fontWeight: '600', color: '#d1d5db', marginBottom: 6 },
  input: { backgroundColor: '#1f2937', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  btn: { backgroundColor: '#4f46e5', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkHighlight: { color: '#818cf8' },
});


// ─────────────────────────────────────────────────────────────────────────────
// src/screens/auth/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import * as Application from 'expo-application';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setTokens } = useAuthStore();

  const handleRegister = async () => {
    if (!form.firstName || !form.email || !form.password) { Alert.alert('Error', 'Please fill all required fields'); return; }
    setLoading(true);
    try {
      const res: any = await apiService.post('/auth/register', form);
      const { user, accessToken, refreshToken } = res.data;
      setTokens(accessToken, refreshToken);
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.error || 'Please try again');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0f' }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 60, marginBottom: 24 }}>Create Account</Text>
      {[
        { key: 'firstName', label: 'First Name', placeholder: 'John' },
        { key: 'lastName', label: 'Last Name', placeholder: 'Doe' },
        { key: 'email', label: 'Email', placeholder: 'john@example.com' },
        { key: 'password', label: 'Password', placeholder: '••••••••', secure: true },
      ].map(f => (
        <View key={f.key}>
          <Text style={{ fontSize: 13, color: '#d1d5db', marginBottom: 6, fontWeight: '600' }}>{f.label}</Text>
          <TextInput
            value={(form as any)[f.key]} onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
            placeholder={f.placeholder} placeholderTextColor="#6b7280"
            secureTextEntry={f.secure} autoCapitalize={f.key === 'email' ? 'none' : 'words'}
            keyboardType={f.key === 'email' ? 'email-address' : 'default'}
            style={{ backgroundColor: '#1f2937', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: '#374151' }}
          />
        </View>
      ))}
      <TouchableOpacity style={{ backgroundColor: '#4f46e5', borderRadius: 14, padding: 16, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Create Account</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => navigation.navigate('Login')}>
        <Text style={{ color: '#6b7280', fontSize: 14 }}>Already have an account? <Text style={{ color: '#818cf8' }}>Sign In</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
