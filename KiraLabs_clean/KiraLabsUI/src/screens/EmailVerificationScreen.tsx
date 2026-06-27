import { API_URL } from '../config';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KiraHeader from '../components/KiraHeader';

export default function EmailVerificationScreen({ route, navigation }: any) {
  const [code, setCode] = useState('');
  const { email } = route.params;

  const handleVerify = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/users/me/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      
      if (res.ok) {
        Alert.alert('Thành công', 'Email đã được xác minh!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Lỗi mạng');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="XÁC MINH EMAIL" hideRightIcon />
      <View style={styles.content}>
        <Text style={styles.title}>Nhập mã xác minh</Text>
        <Text style={styles.sub}>Mã 4 chữ số đã được gửi tới {email}</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="0000" 
          keyboardType="numeric" 
          maxLength={4} 
          value={code} 
          onChangeText={setCode} 
          textAlign="center"
        />

        <TouchableOpacity style={styles.btn} onPress={handleVerify}>
          <Text style={styles.btnText}>XÁC NHẬN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 30, alignItems: 'center', marginTop: 40 },
  title: { fontSize: 24, fontFamily: 'Afacad-Bold', color: '#1A1A1A' },
  sub: { fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' },
  input: { width: '60%', fontSize: 30, letterSpacing: 10, borderBottomWidth: 2, borderColor: '#2B5CE6', marginTop: 40, paddingBottom: 10, color: '#1A1A1A' },
  btn: { backgroundColor: '#2B5CE6', width: '100%', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 50 },
  btnText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 16 }
});