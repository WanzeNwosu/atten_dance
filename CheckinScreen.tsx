// src/screens/meeting/CheckinScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';

export default function CheckinScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckin = async () => {
    if (!code.trim()) { Alert.alert('Error', 'Please enter a meeting code'); return; }
    setLoading(true);
    try {
      await apiService.post('/attendance/checkin/code', { code: code.trim().toUpperCase() });
      Alert.alert('Success', 'Checked in successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Check-in Failed', err?.error || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f', padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 }}>Enter Meeting Code</Text>
      <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>Ask the meeting host for the code</Text>
      <TextInput
        value={code} onChangeText={setCode} placeholder="e.g. ABC123"
        placeholderTextColor="#6b7280" autoCapitalize="characters" maxLength={8}
        style={{ backgroundColor: '#1f2937', borderRadius: 16, padding: 20, color: '#fff', fontSize: 28, textAlign: 'center', letterSpacing: 6, fontWeight: '700', borderWidth: 2, borderColor: '#374151' }}
      />
      <TouchableOpacity style={{ backgroundColor: '#4f46e5', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24, opacity: loading ? 0.6 : 1 }}
        onPress={handleCheckin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Check In</Text>}
      </TouchableOpacity>
    </View>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// src/screens/meeting/MeetingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function MeetingScreen({ route }: any) {
  const { meeting } = route.params;
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0f' }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#818cf8', fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 }}>{meeting.title}</Text>
      {meeting.description && <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>{meeting.description}</Text>}

      <View style={{ backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1f2937' }}>
        {[
          { label: '📅 Date', value: new Date(meeting.startTime).toLocaleDateString() },
          { label: '⏰ Time', value: `${new Date(meeting.startTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })} – ${new Date(meeting.endTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}` },
          { label: '📍 Location', value: meeting.location || 'Not specified' },
          { label: '🎯 Type', value: meeting.type },
          { label: '👤 Host', value: meeting.host ? `${meeting.host.firstName} ${meeting.host.lastName}` : '—' },
        ].map(row => (
          <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: '#9ca3af', fontSize: 13 }}>{row.label}</Text>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' }}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={{ backgroundColor: '#4f46e5', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24 }}
        onPress={() => navigation.navigate('Scan')}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>📱 Scan QR to Check In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// src/screens/profile/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0f' }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 }}>Profile</Text>

      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 80, height: 80, backgroundColor: '#4f46e5', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{user?.firstName} {user?.lastName}</Text>
        <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }}>{user?.email}</Text>
        <View style={{ marginTop: 8, backgroundColor: '#1e1b4b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: '#818cf8', fontSize: 12, fontWeight: '600' }}>{user?.role?.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      {[
        { icon: '📋', label: 'Attendance History', onPress: () => navigation.navigate('History') },
        { icon: '🔐', label: 'Biometric Settings', onPress: () => navigation.navigate('BiometricEnroll') },
        { icon: '🔔', label: 'Notifications', onPress: () => {} },
        { icon: '📱', label: 'Registered Devices', onPress: () => {} },
      ].map(item => (
        <TouchableOpacity key={item.label} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937' }}
          onPress={item.onPress}>
          <Text style={{ fontSize: 20, marginRight: 14 }}>{item.icon}</Text>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 }}>{item.label}</Text>
          <Text style={{ color: '#4b5563', fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={{ backgroundColor: '#1f1315', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#3d1a1a' }}
        onPress={handleLogout}>
        <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700' }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// src/screens/profile/HistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';

export default function HistoryScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiService.get(`/users/me/attendance?page=${page}&limit=20`);
        setRecords(res.data?.records || []);
      } finally { setLoading(false); }
    })();
  }, [page]);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#818cf8" /></View>;

  return (
    <FlatList
      data={records}
      keyExtractor={item => item.id}
      style={{ flex: 1, backgroundColor: '#0a0a0f' }}
      contentContainerStyle={{ padding: 24, paddingTop: 60 }}
      ListHeaderComponent={<Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 }}>Attendance History</Text>}
      ListEmptyComponent={<Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 48 }}>No attendance records yet</Text>}
      renderItem={({ item }) => (
        <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{item.meeting?.title}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
              {item.checkInAt ? new Date(item.checkInAt).toLocaleDateString() : '—'}
            </Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
            backgroundColor: item.status === 'PRESENT' ? '#10b98120' : item.status === 'LATE' ? '#f59e0b20' : '#ef444420',
            color: item.status === 'PRESENT' ? '#10b981' : item.status === 'LATE' ? '#f59e0b' : '#ef4444',
          }}>{item.status}</Text>
        </View>
      )}
    />
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// src/screens/profile/BiometricEnrollScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { apiService } from '../../services/api';

export default function BiometricEnrollScreen({ navigation }: any) {
  const [enrolledFace, setEnrolledFace] = useState(false);
  const [enrolledFP, setEnrolledFP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    (async () => {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometric(hw && enrolled);
      const res: any = await apiService.get('/biometric/status');
      setEnrolledFace(res.data?.faceEnrolled || false);
      setEnrolledFP(res.data?.fingerprintEnrolled || false);
    })();
  }, []);

  const enrollFingerprint = async () => {
    if (!hasBiometric) { Alert.alert('Not Available', 'Biometric hardware not available on this device'); return; }
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to enroll fingerprint' });
      if (!result.success) { setLoading(false); return; }
      await apiService.post('/biometric/fingerprint/enroll', {
        platformHandle: `fp_${Date.now()}`, platform: 'android', deviceId: 'device-1',
      });
      setEnrolledFP(true);
      Alert.alert('Success', 'Fingerprint enrolled successfully!');
    } catch { Alert.alert('Error', 'Enrollment failed'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f', padding: 24, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#818cf8', fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 }}>Biometric Settings</Text>
      <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>Enroll your biometrics for faster check-in</Text>

      <View style={{ backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1f2937', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>🤳 Face Recognition</Text>
            <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Enroll via the web portal</Text>
          </View>
          <View style={{ backgroundColor: enrolledFace ? '#10b98120' : '#6b728020', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: enrolledFace ? '#10b981' : '#9ca3af', fontSize: 12, fontWeight: '600' }}>
              {enrolledFace ? 'Enrolled' : 'Not enrolled'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: '#111827', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1f2937' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>👆 Fingerprint</Text>
            <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>Use device biometric sensor</Text>
          </View>
          <View style={{ backgroundColor: enrolledFP ? '#10b98120' : '#6b728020', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: enrolledFP ? '#10b981' : '#9ca3af', fontSize: 12, fontWeight: '600' }}>
              {enrolledFP ? 'Enrolled' : 'Not enrolled'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
          onPress={enrollFingerprint} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <Text style={{ color: '#fff', fontWeight: '700' }}>{enrolledFP ? 'Re-enroll Fingerprint' : 'Enroll Fingerprint'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// src/services/backgroundSync.ts
import { apiService } from './api';
import { getPendingCheckins, markSynced } from '../db/localDB';
import NetInfo from '@react-native-community/netinfo';

export class BackgroundSync {
  private interval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start() {
    this.interval = setInterval(() => this.sync(), 60_000); // every 60 seconds
    this.sync(); // immediate first run
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  private async sync() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) return;

      const pending = await getPendingCheckins();
      if (pending.length === 0) return;

      const checkins = pending.map(p => ({
        localId: p.id,
        meetingId: p.meeting_id,
        checkInAt: p.check_in_at,
        method: p.method,
        qrToken: p.qr_token,
        latitude: p.latitude,
        longitude: p.longitude,
        gpsAccuracy: p.gps_accuracy,
        qrVerified: !!p.qr_verified,
        gpsVerified: !!p.gps_verified,
        deviceId: p.device_id,
      }));

      const res: any = await apiService.post('/sync/checkins', { checkins });
      const results = res.data?.results || [];
      const synced = results.filter((r: any) => r.success).map((r: any) => r.id);
      if (synced.length > 0) await markSynced(synced);
    } catch { /* ignore - will retry next interval */ }
    finally { this.isRunning = false; }
  }
}
