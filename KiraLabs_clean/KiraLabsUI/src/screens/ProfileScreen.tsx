import { API_URL } from '../config';
// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KiraHeader from '../components/KiraHeader';


export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchUser(); });
    return unsubscribe;
  }, [navigation]);

  const sendVerification = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_URL}/users/me/send-verify`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      navigation.navigate('EmailVerification', { email: user.email });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi mã');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} color="#2B5CE6" />;

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="HỒ SƠ CÁ NHÂN" hideRightIcon />
      <ScrollView contentContainerStyle={styles.content}>

        {user && !user.isEmailVerified && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ Tài khoản chưa xác minh Email. Bạn sẽ không thể sử dụng tính năng tạo Video AI.</Text>
            <TouchableOpacity style={styles.verifyBtn} onPress={sendVerification}>
              <Text style={styles.verifyBtnText}>Xác minh ngay</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={user?.fullName || ''} editable={false} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={user?.email || ''} editable={false} />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput style={styles.input} value={user?.phoneNumber || 'Chưa cập nhật'} editable={false} />

        <Text style={styles.label}>Giới tính</Text>
        <TextInput style={styles.input} value={user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : 'Khác'} editable={false} />

        <Text style={styles.label}>Ngày sinh</Text>
        <TextInput style={styles.input} value={user?.dateOfBirth || 'Chưa cập nhật'} editable={false} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 20, paddingBottom: 40 },
  warningBox: { backgroundColor: '#FFF1F0', borderColor: '#FFA39E', borderWidth: 1, padding: 15, borderRadius: 8, marginBottom: 20 },
  warningText: { color: '#CF1322', fontSize: 13, marginBottom: 10, lineHeight: 20, fontFamily: 'Afacad-Regular' },
  verifyBtn: { backgroundColor: '#FF4D4F', padding: 10, borderRadius: 6, alignItems: 'center' },
  verifyBtnText: { color: '#FFF', fontWeight: 'bold', fontFamily: 'Afacad-Bold' },
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 15, fontFamily: 'Afacad-Bold' },
  input: { backgroundColor: '#F5F5F5', padding: 14, borderRadius: 8, color: '#1A1A1A', fontFamily: 'Afacad-Regular', fontSize: 15 }
});