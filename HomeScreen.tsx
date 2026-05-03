// src/screens/home/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { getPendingCheckins } from '../../db/localDB';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [upRes, statsRes, pending] = await Promise.all([
        apiService.get('/meetings/upcoming') as any,
        apiService.get('/attendance/stats') as any,
        getPendingCheckins(),
      ]);
      setUpcoming(upRes.data || []);
      setStats(statsRes.data || null);
      setPendingSync(pending.length);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={S.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}>
      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.greeting}>Good {getGreeting()},</Text>
          <Text style={S.name}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <View style={S.avatar}>
          <Text style={S.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
      </View>

      {/* Offline sync badge */}
      {pendingSync > 0 && (
        <View style={S.syncBadge}>
          <Text style={S.syncText}>⏳ {pendingSync} offline check-in{pendingSync > 1 ? 's' : ''} pending sync</Text>
        </View>
      )}

      {/* Stats cards */}
      {stats && (
        <View style={S.statsRow}>
          {[
            { label: 'Present', value: stats.present, color: '#10b981' },
            { label: 'Late', value: stats.late, color: '#f59e0b' },
            { label: 'Rate', value: `${stats.attendanceRate}%`, color: '#818cf8' },
          ].map(s => (
            <View key={s.label} style={S.statCard}>
              <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <Text style={S.sectionTitle}>Quick Actions</Text>
      <View style={S.actionsRow}>
        <TouchableOpacity style={[S.actionCard, { backgroundColor: '#1e1b4b' }]}
          onPress={() => navigation.navigate('Scan')}>
          <Text style={S.actionIcon}>📱</Text>
          <Text style={S.actionLabel}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.actionCard, { backgroundColor: '#14532d' }]}
          onPress={() => navigation.navigate('History')}>
          <Text style={S.actionIcon}>📋</Text>
          <Text style={S.actionLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.actionCard, { backgroundColor: '#1c1917' }]}
          onPress={() => navigation.navigate('BiometricEnroll')}>
          <Text style={S.actionIcon}>🔐</Text>
          <Text style={S.actionLabel}>Biometrics</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming meetings */}
      <Text style={S.sectionTitle}>Upcoming Meetings</Text>
      {upcoming.length === 0 ? (
        <View style={S.emptyBox}>
          <Text style={S.emptyText}>No upcoming meetings</Text>
        </View>
      ) : (
        upcoming.map((m: any) => (
          <TouchableOpacity key={m.id} style={S.meetingCard}
            onPress={() => navigation.navigate('Meeting', { meeting: m })}>
            <View style={S.meetingDate}>
              <Text style={S.meetingDay}>{new Date(m.startTime).getDate()}</Text>
              <Text style={S.meetingMonth}>{new Date(m.startTime).toLocaleDateString('en', { month: 'short' })}</Text>
            </View>
            <View style={S.meetingInfo}>
              <Text style={S.meetingTitle} numberOfLines={1}>{m.title}</Text>
              <Text style={S.meetingTime}>
                {new Date(m.startTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                {m.location ? ` • ${m.location}` : ''}
              </Text>
              <Text style={[S.meetingType, { color: m.type === 'VIRTUAL' ? '#a78bfa' : '#60a5fa' }]}>{m.type}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60 },
  greeting: { fontSize: 14, color: '#6b7280' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  avatar: { width: 44, height: 44, backgroundColor: '#4f46e5', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  syncBadge: { marginHorizontal: 24, backgroundColor: '#f59e0b20', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f59e0b40' },
  syncText: { color: '#f59e0b', fontSize: 13, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 24, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#111827', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginHorizontal: 24, marginTop: 24, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 24 },
  actionCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyBox: { marginHorizontal: 24, backgroundColor: '#111827', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { color: '#6b7280', fontSize: 14 },
  meetingCard: { marginHorizontal: 24, marginBottom: 10, backgroundColor: '#111827', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: '#1f2937' },
  meetingDate: { width: 44, alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 10, padding: 6 },
  meetingDay: { fontSize: 20, fontWeight: '800', color: '#818cf8' },
  meetingMonth: { fontSize: 10, color: '#818cf8', textTransform: 'uppercase' },
  meetingInfo: { flex: 1 },
  meetingTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  meetingTime: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  meetingType: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
