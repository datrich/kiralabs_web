// src/screens/AdminShopsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { getAdminShops, approveShop, rejectShop, AdminShopApplicant } from '../services/adminApi';
import { ShopStatus } from '../services/shopApi';

const TABS: { key: ShopStatus; label: string }[] = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

export default function AdminShopsScreen({ navigation }: any) {
  const [tab, setTab] = useState<ShopStatus>('pending');
  const [shops, setShops] = useState<AdminShopApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async (status: ShopStatus) => {
    try {
      const data = await getAdminShops(status);
      setShops(data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); load(tab); }, [tab]);

  const onApprove = (item: AdminShopApplicant) => {
    Alert.alert('Duyệt shop', `Duyệt "${item.shopName}"? Người dùng sẽ được lên quyền Shop.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt', onPress: async () => {
          setActingId(item.id);
          try { await approveShop(item.id); await load(tab); }
          catch (e: any) { Alert.alert('Lỗi', e?.message); }
          finally { setActingId(null); }
        },
      },
    ]);
  };

  const onReject = (item: AdminShopApplicant) => {
    Alert.prompt
      ? Alert.prompt('Từ chối shop', 'Nhập lý do (không bắt buộc):', async (reason?: string) => {
          setActingId(item.id);
          try { await rejectShop(item.id, reason); await load(tab); }
          catch (e: any) { Alert.alert('Lỗi', e?.message); }
          finally { setActingId(null); }
        })
      : Alert.alert('Từ chối shop', `Từ chối "${item.shopName}"?`, [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Từ chối', style: 'destructive', onPress: async () => {
              setActingId(item.id);
              try { await rejectShop(item.id); await load(tab); }
              catch (e: any) { Alert.alert('Lỗi', e?.message); }
              finally { setActingId(null); }
            },
          },
        ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="DUYỆT ĐĂNG KÝ SHOP" hideRightIcon />

      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2B5CE6" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(tab); }} />}
        >
          {shops.length === 0 && <Text style={styles.empty}>Không có đơn nào.</Text>}
          {shops.map(item => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.shopName}>{item.shopName}</Text>
              <Text style={styles.rowText}>📍 {item.address}</Text>
              {!!item.phone && <Text style={styles.rowText}>📞 {item.phone}</Text>}
              {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
              <View style={styles.divider} />
              <Text style={styles.applicant}>
                Người đăng ký: {item.user?.fullName || '—'}
                {item.user?.email ? ` (${item.user.email})` : item.user?.phoneNumber ? ` (${item.user.phoneNumber})` : ''}
              </Text>
              {item.status === 'rejected' && !!item.rejectReason && (
                <Text style={styles.rejectReason}>Lý do từ chối: {item.rejectReason}</Text>
              )}

              {tab === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.btn, styles.rejectBtn]} disabled={actingId === item.id} onPress={() => onReject(item)}>
                    <Text style={styles.rejectBtnText}>Từ chối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.approveBtn]} disabled={actingId === item.id} onPress={() => onApprove(item)}>
                    {actingId === item.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.approveBtnText}>Duyệt</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: '#F2F2F2', alignItems: 'center' },
  tabActive: { backgroundColor: '#2B5CE6' },
  tabText: { fontFamily: 'Afacad-Bold', fontSize: 13, color: '#666' },
  tabTextActive: { color: '#FFF' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontFamily: 'Afacad-Regular', fontSize: 14 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  shopName: { fontFamily: 'Afacad-Bold', fontSize: 17, color: '#1A1A1A', marginBottom: 6 },
  rowText: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#555', marginTop: 2 },
  desc: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#777', marginTop: 8, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  applicant: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#888' },
  rejectReason: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#C53030', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  approveBtn: { backgroundColor: '#2B5CE6' },
  approveBtnText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14 },
  rejectBtn: { backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#FEB2B2' },
  rejectBtnText: { color: '#FF4D4F', fontFamily: 'Afacad-Bold', fontSize: 14 },
});
