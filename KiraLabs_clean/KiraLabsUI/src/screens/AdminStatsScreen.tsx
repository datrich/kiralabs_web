// src/screens/AdminStatsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { getAdminStats, AdminStats } from '../services/adminApi';

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function AdminStatsScreen({ navigation }: any) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (e: any) {
      // im lặng, hiển thị trạng thái rỗng
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { const unsub = navigation.addListener('focus', load); return unsub; }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="THỐNG KÊ HỆ THỐNG" hideRightIcon />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2B5CE6" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          <Text style={styles.sectionTitle}>Người dùng</Text>
          <View style={styles.bigCard}>
            <Text style={styles.bigValue}>{stats?.totalUsers ?? 0}</Text>
            <Text style={styles.bigLabel}>Tổng số tài khoản</Text>
          </View>
          <View style={styles.row}>
            <StatCard label="User" value={stats?.byRole.user ?? 0} color="#1A1A1A" />
            <StatCard label="Shop" value={stats?.byRole.shop ?? 0} color="#2B5CE6" />
            <StatCard label="Admin" value={stats?.byRole.admin ?? 0} color="#D69E2E" />
          </View>

          <Text style={styles.sectionTitle}>Shop</Text>
          <View style={styles.row}>
            <StatCard label="Chờ duyệt" value={stats?.shops.pending ?? 0} color="#D69E2E" />
            <StatCard label="Đã duyệt" value={stats?.shops.approved ?? 0} color="#22863A" />
          </View>

          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          <View style={styles.row}>
            <StatCard label="Tổng sản phẩm" value={stats?.products.total ?? 0} color="#1A1A1A" />
            <StatCard label="Chờ duyệt" value={stats?.products.pendingApproval ?? 0} color="#D69E2E" />
          </View>

          <Text style={styles.hint}>Kéo xuống để làm mới số liệu.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontFamily: 'Afacad-Bold', fontSize: 15, color: '#1A1A1A', marginTop: 18, marginBottom: 10, letterSpacing: 0.3 },
  bigCard: { backgroundColor: '#F4F7FF', borderRadius: 14, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: '#E2E9FF' },
  bigValue: { fontFamily: 'Afacad-Bold', fontSize: 40, color: '#2B5CE6' },
  bigLabel: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  cardValue: { fontFamily: 'Afacad-Bold', fontSize: 26 },
  cardLabel: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#777', marginTop: 4 },
  hint: { textAlign: 'center', color: '#AAA', fontSize: 12, marginTop: 24, fontFamily: 'Afacad-Regular' },
});
