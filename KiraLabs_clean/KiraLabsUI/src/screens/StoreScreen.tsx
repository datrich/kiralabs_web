import { API_URL } from '../config';
// src/screens/StoreScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, ScrollView, Linking, Platform, Alert, Dimensions,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { getProducts, Product } from '../services/productApi';

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - 18 * 2 - 12) / 2;

type Shop = { id: number; shopName: string; address: string; phone?: string | null; description?: string | null };

export default function StoreScreen({ navigation, route }: any) {
  const shopId = route.params?.shopId as number;
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/shops/${shopId}`);
        const data = await res.json();
        if (res.ok) setShop(data.shop);
        setProducts(await getProducts({ shopId }));
      } catch (e) {
        // bỏ qua
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId]);

  const openMap = () => {
    if (!shop?.address) return;
    const query = encodeURIComponent(shop.address);
    // Mở app bản đồ / Google Maps với địa chỉ shop
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    })!;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() =>
        Alert.alert('Lỗi', 'Không mở được bản đồ'),
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="CỬA HÀNG" hideRightIcon />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2B5CE6" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 34 }}>
          <View style={styles.shopHeader}>
            <View style={styles.shopAvatar}><Text style={styles.shopAvatarText}>{(shop?.shopName || 'S').charAt(0).toUpperCase()}</Text></View>
            <Text style={styles.shopName}>{shop?.shopName || 'Cửa hàng'}</Text>
            {!!shop?.description && <Text style={styles.shopDesc}>{shop.description}</Text>}
            <View style={styles.addressBox}>
              <Text style={styles.addressText}>📍 {shop?.address || 'Chưa cập nhật địa chỉ'}</Text>
              {!!shop?.phone && <Text style={styles.phoneText}>📞 {shop.phone}</Text>}
            </View>
            <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
              <Text style={styles.mapBtnText}>XEM TRÊN BẢN ĐỒ</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>SẢN PHẨM CỦA SHOP ({products.length})</Text>
          {products.length === 0 ? (
            <Text style={styles.empty}>Shop chưa có sản phẩm nào được duyệt.</Text>
          ) : (
            <View style={styles.grid}>
              {products.map((p) => (
                <TouchableOpacity key={p.id} style={styles.card} activeOpacity={0.86}
                  onPress={() => navigation.navigate('ProductDetail', { productId: p.id, category: p.categoryName })}>
                  <View style={styles.imageBox}>
                    {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={styles.cardImage} /> : <View style={styles.cardImage} />}
                  </View>
                  <Text style={styles.cardPrice}>{p.price != null ? `$ ${p.price}.00` : '—'}</Text>
                  <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  shopHeader: { padding: 20, alignItems: 'center', borderBottomWidth: 8, borderBottomColor: '#F5F5F5' },
  shopAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2B5CE6', alignItems: 'center', justifyContent: 'center' },
  shopAvatarText: { color: '#FFF', fontSize: 28, fontFamily: 'Afacad-Bold' },
  shopName: { fontFamily: 'Afacad-Bold', fontSize: 20, color: '#1A1A1A', marginTop: 12 },
  shopDesc: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#777', marginTop: 6, textAlign: 'center' },
  addressBox: { marginTop: 14, alignSelf: 'stretch', backgroundColor: '#F8F9FA', borderRadius: 10, padding: 14 },
  addressText: { fontFamily: 'Afacad-Regular', fontSize: 14, color: '#444', lineHeight: 20 },
  phoneText: { fontFamily: 'Afacad-Regular', fontSize: 14, color: '#444', marginTop: 6 },
  mapBtn: { marginTop: 14, alignSelf: 'stretch', backgroundColor: '#2B5CE6', paddingVertical: 13, borderRadius: 8, alignItems: 'center' },
  mapBtnText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14, letterSpacing: 0.5 },
  sectionTitle: { fontFamily: 'Afacad-Bold', fontSize: 14, color: '#1A1A1A', letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 20, fontFamily: 'Afacad-Regular', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, columnGap: 12, rowGap: 18 },
  card: { width: CARD_WIDTH },
  imageBox: { width: '100%', height: CARD_WIDTH * 1.2, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F3F3F3' },
  cardImage: { width: '100%', height: '100%', backgroundColor: '#F0F0F0' },
  cardPrice: { fontFamily: 'Afacad-Bold', fontSize: 14, color: '#1A1A1A', marginTop: 8 },
  cardName: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#656565', marginTop: 2 },
});
