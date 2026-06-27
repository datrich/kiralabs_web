// src/screens/ShopProductsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, ScrollView, RefreshControl, Alert,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { getMyProducts, deleteProduct, Product, ProductStatus } from '../services/productApi';

const STATUS_META: Record<ProductStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'CHỜ DUYỆT', color: '#B7791F', bg: '#FFFBEB' },
  approved: { label: 'ĐÃ DUYỆT', color: '#22863A', bg: '#F0FFF4' },
  rejected: { label: 'BỊ TỪ CHỐI', color: '#C53030', bg: '#FFF5F5' },
};

export default function ShopProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await getMyProducts();
      setProducts(data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tải được sản phẩm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { const unsub = navigation.addListener('focus', load); return unsub; }, [navigation]);

  const onDelete = (p: Product) => {
    Alert.alert('Xóa sản phẩm', `Xóa "${p.name}"? Hành động này không thể hoàn tác.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          setActingId(p.id);
          try {
            await deleteProduct(p.id);
            setProducts(prev => prev.filter(it => it.id !== p.id));
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Không xóa được sản phẩm');
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="SẢN PHẨM CỦA TÔI" hideRightIcon />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2B5CE6" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {products.length === 0 && (
            <Text style={styles.empty}>Bạn chưa có sản phẩm nào. Bấm nút bên dưới để đăng sản phẩm đầu tiên.</Text>
          )}
          {products.map((p) => {
            const meta = STATUS_META[p.status];
            return (
              <View key={p.id} style={styles.card}>
                {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={styles.thumb} /> : <View style={styles.thumb} />}
                <View style={styles.cardBody}>
                  <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.meta}>{p.categoryName || '—'}{p.price ? ` · $${p.price}` : ''}</Text>
                  {!!p.clothType && <Text style={styles.metaSmall}>Try-on: {p.clothType.toUpperCase()}</Text>}
                  <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} disabled={actingId === p.id} onPress={() => onDelete(p)}>
                  {actingId === p.id
                    ? <ActivityIndicator color="#FF4D4F" size="small" />
                    : <Text style={styles.deleteText}>Xóa</Text>}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct' as any)}>
          <Text style={styles.addBtnText}>＋ ĐĂNG SẢN PHẨM MỚI</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  list: { padding: 16, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontFamily: 'Afacad-Regular', fontSize: 14, lineHeight: 21, paddingHorizontal: 20 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 10, marginBottom: 12 },
  thumb: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#F0F0F0' },
  cardBody: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  name: { fontFamily: 'Afacad-Bold', fontSize: 16, color: '#1A1A1A' },
  meta: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#666', marginTop: 3 },
  metaSmall: { fontFamily: 'Afacad-Regular', fontSize: 11, color: '#999', marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginTop: 8 },
  badgeText: { fontFamily: 'Afacad-Bold', fontSize: 10, letterSpacing: 0.5 },
  deleteBtn: { width: 56, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F0F0F0' },
  deleteText: { fontFamily: 'Afacad-Bold', fontSize: 13, color: '#FF4D4F' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  addBtn: { backgroundColor: '#2B5CE6', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 15, letterSpacing: 0.5 },
});
