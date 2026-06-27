// src/screens/AdminProductsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { getAdminProducts, approveProduct, rejectProduct } from '../services/adminApi';
import { Product, ProductStatus } from '../services/productApi';

const TABS: { key: ProductStatus; label: string }[] = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

export default function AdminProductsScreen({ navigation }: any) {
  const [tab, setTab] = useState<ProductStatus>('pending');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async (status: ProductStatus) => {
    try {
      setProducts(await getAdminProducts(status));
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tải được sản phẩm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); load(tab); }, [tab]);

  const onApprove = (p: Product) => {
    setActingId(p.id);
    approveProduct(p.id)
      .then((msg) => { Alert.alert('Thành công', msg); return load(tab); })
      .catch((e) => Alert.alert('Lỗi', e?.message))
      .finally(() => setActingId(null));
  };

  const onReject = (p: Product) => {
    Alert.alert('Từ chối sản phẩm', `Từ chối "${p.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối', style: 'destructive', onPress: () => {
          setActingId(p.id);
          rejectProduct(p.id)
            .then(() => load(tab))
            .catch((e) => Alert.alert('Lỗi', e?.message))
            .finally(() => setActingId(null));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="DUYỆT SẢN PHẨM" hideRightIcon />

      <View style={styles.tabRow}>
        {TABS.map((t) => (
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
          {products.length === 0 && <Text style={styles.empty}>Không có sản phẩm nào.</Text>}
          {products.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.topRow}>
                {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={styles.thumb} /> : <View style={styles.thumb} />}
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.meta}>{p.categoryName || '—'}{p.price ? ` · $${p.price}` : ''}</Text>
                  <Text style={styles.shop}>🏪 {p.shopName || 'Hàng Kira'}{p.shopAddress ? ` — ${p.shopAddress}` : ''}</Text>
                  {!!p.clothType && <Text style={styles.metaSmall}>Try-on: {p.clothType.toUpperCase()}</Text>}
                </View>
              </View>
              {!!p.description && <Text style={styles.desc} numberOfLines={3}>{p.description}</Text>}

              {tab === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.btn, styles.rejectBtn]} disabled={actingId === p.id} onPress={() => onReject(p)}>
                    <Text style={styles.rejectText}>Từ chối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.approveBtn]} disabled={actingId === p.id} onPress={() => onApprove(p)}>
                    {actingId === p.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.approveText}>Duyệt (+10 credit)</Text>}
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
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 12, marginBottom: 14 },
  topRow: { flexDirection: 'row' },
  thumb: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#F0F0F0' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  name: { fontFamily: 'Afacad-Bold', fontSize: 16, color: '#1A1A1A' },
  meta: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#666', marginTop: 2 },
  shop: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#2B5CE6', marginTop: 4 },
  metaSmall: { fontFamily: 'Afacad-Regular', fontSize: 11, color: '#999', marginTop: 2 },
  desc: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#777', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  approveBtn: { backgroundColor: '#2B5CE6' },
  approveText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14 },
  rejectBtn: { backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#FEB2B2' },
  rejectText: { color: '#FF4D4F', fontFamily: 'Afacad-Bold', fontSize: 14 },
});
