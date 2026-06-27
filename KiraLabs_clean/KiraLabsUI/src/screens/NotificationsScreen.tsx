// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { getNotifications, markAllRead, markRead, AppNotification, NotificationType } from '../services/notificationApi';

const ICON: Record<NotificationType, string> = {
  shop_pending: '🏪',
  product_pending: '📦',
  shop_approved: '✅',
  shop_rejected: '❌',
  product_approved: '🎉',
  product_rejected: '⚠️',
  new_review: '⭐',
  verify_email: '✉️',
  admin_granted: '👑',
  admin_revoked: '🔻',
};

export default function NotificationsScreen({ navigation }: any) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { notifications } = await getNotifications();
      setItems(notifications);
    } catch (e) {
      // bỏ qua
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { const unsub = navigation.addListener('focus', load); return unsub; }, [navigation]);

  const handlePress = async (n: AppNotification) => {
    if (!n.isRead) {
      try { await markRead(n.id); } catch {}
      setItems(prev => prev.map(it => (it.id === n.id ? { ...it, isRead: 1 } : it)));
    }
    // Điều hướng theo loại thông báo
    switch (n.type) {
      case 'shop_pending':
        navigation.navigate('AdminShops'); break;
      case 'product_pending':
        navigation.navigate('AdminProducts'); break;
      case 'shop_approved':
      case 'shop_rejected':
        navigation.navigate('ShopApply'); break;
      case 'product_approved':
      case 'product_rejected':
        navigation.navigate('ShopProducts'); break;
      case 'verify_email':
        navigation.navigate('Profile'); break;
      default: break;
    }
  };

  const handleReadAll = async () => {
    try { await markAllRead(); } catch {}
    setItems(prev => prev.map(it => ({ ...it, isRead: 1 })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="THÔNG BÁO" hideRightIcon />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2B5CE6" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {items.length > 0 && (
            <TouchableOpacity style={styles.readAllBtn} onPress={handleReadAll}>
              <Text style={styles.readAllText}>Đánh dấu đã đọc tất cả</Text>
            </TouchableOpacity>
          )}

          {items.length === 0 && <Text style={styles.empty}>Chưa có thông báo nào.</Text>}

          {items.map((n) => (
            <TouchableOpacity key={n.id} style={[styles.row, !n.isRead && styles.rowUnread]} activeOpacity={0.8} onPress={() => handlePress(n)}>
              <Text style={styles.icon}>{ICON[n.type] || '🔔'}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.title}>{n.title}</Text>
                {!!n.body && <Text style={styles.body}>{n.body}</Text>}
              </View>
              {!n.isRead && <View style={styles.dot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  list: { padding: 16, paddingBottom: 40 },
  readAllBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  readAllText: { fontFamily: 'Afacad-Bold', fontSize: 12, color: '#2B5CE6' },
  empty: { textAlign: 'center', color: '#999', marginTop: 50, fontFamily: 'Afacad-Regular', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 14, marginBottom: 10 },
  rowUnread: { backgroundColor: '#F4F7FF', borderColor: '#DCE6FF' },
  icon: { fontSize: 22, marginRight: 12 },
  rowBody: { flex: 1 },
  title: { fontFamily: 'Afacad-Bold', fontSize: 15, color: '#1A1A1A' },
  body: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#666', marginTop: 3, lineHeight: 19 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF4D4F', marginTop: 4, marginLeft: 8 },
});
