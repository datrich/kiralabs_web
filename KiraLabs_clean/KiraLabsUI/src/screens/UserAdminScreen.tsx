// src/screens/UserAdminScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { getUsers, promoteAdmin, demoteAdmin, ManagedUser } from '../services/adminApi';

function roleBadge(u: ManagedUser) {
  if (u.isSuperAdmin) return { text: 'SUPER ADMIN', color: '#9333EA' };
  if (u.role === 'admin') return { text: 'ADMIN', color: '#D69E2E' };
  if (u.role === 'shop') return { text: 'SHOP', color: '#2B5CE6' };
  return { text: 'USER', color: '#718096' };
}

export default function UserAdminScreen({ navigation }: any) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async (q?: string) => {
    try {
      const data = await getUsers(q);
      setUsers(data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { const unsub = navigation.addListener('focus', () => load(search)); return unsub; }, [navigation]);

  const doPromote = (u: ManagedUser) => {
    Alert.alert('Cấp quyền admin', `Cấp quyền ADMIN cho "${u.fullName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Cấp quyền', onPress: async () => {
          setActingId(u.id);
          try { await promoteAdmin(u.id); await load(search); }
          catch (e: any) { Alert.alert('Lỗi', e?.message); }
          finally { setActingId(null); }
        },
      },
    ]);
  };

  const doDemote = (u: ManagedUser) => {
    Alert.alert('Thu hồi quyền admin', `Thu hồi quyền admin của "${u.fullName}" (về user)?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Thu hồi', style: 'destructive', onPress: async () => {
          setActingId(u.id);
          try { await demoteAdmin(u.id); await load(search); }
          catch (e: any) { Alert.alert('Lỗi', e?.message); }
          finally { setActingId(null); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="QUẢN LÝ ADMIN" hideRightIcon />

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên / email / sđt"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => { setLoading(true); load(search); }}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => { setLoading(true); load(search); }}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2B5CE6" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(search); }} />}
        >
          {users.length === 0 && <Text style={styles.empty}>Không có tài khoản nào.</Text>}
          {users.map((u) => {
            const badge = roleBadge(u);
            const isAdmin = u.role === 'admin';
            return (
              <View key={u.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{u.fullName}</Text>
                    <Text style={styles.contact}>{u.email || u.phoneNumber || '—'}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.color }]}>
                    <Text style={styles.badgeText}>{badge.text}</Text>
                  </View>
                </View>

                {u.isSuperAdmin ? (
                  <Text style={styles.lockNote}>🔒 Super Admin — không thể thay đổi quyền.</Text>
                ) : isAdmin ? (
                  <TouchableOpacity style={[styles.actionBtn, styles.demoteBtn]} disabled={actingId === u.id} onPress={() => doDemote(u)}>
                    {actingId === u.id ? <ActivityIndicator color="#FF4D4F" /> : <Text style={styles.demoteText}>Thu hồi quyền admin</Text>}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.actionBtn, styles.promoteBtn]} disabled={actingId === u.id} onPress={() => doPromote(u)}>
                    {actingId === u.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.promoteText}>Cấp quyền admin</Text>}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, fontFamily: 'Afacad-Regular', fontSize: 14, color: '#1A1A1A' },
  searchBtn: { backgroundColor: '#2B5CE6', paddingHorizontal: 18, justifyContent: 'center', borderRadius: 8 },
  searchBtnText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontFamily: 'Afacad-Regular', fontSize: 14 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: 'Afacad-Bold', fontSize: 16, color: '#1A1A1A' },
  contact: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 10, letterSpacing: 0.5 },
  lockNote: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#9333EA', marginTop: 12 },
  actionBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  promoteBtn: { backgroundColor: '#2B5CE6' },
  promoteText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14 },
  demoteBtn: { backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#FEB2B2' },
  demoteText: { color: '#FF4D4F', fontFamily: 'Afacad-Bold', fontSize: 14 },
});
