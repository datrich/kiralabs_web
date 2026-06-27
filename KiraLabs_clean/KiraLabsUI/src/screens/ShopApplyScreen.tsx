// src/screens/ShopApplyScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import KiraHeader from '../components/KiraHeader';
import { applyShop, getMyShop, Shop } from '../services/shopApi';

export default function ShopApplyScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);

  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    try {
      const myShop = await getMyShop();
      setShop(myShop);
      if (myShop) {
        setShopName(myShop.shopName || '');
        setAddress(myShop.address || '');
        setPhone(myShop.phone || '');
        setDescription(myShop.description || '');
      }
    } catch (e: any) {
      console.log(e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const handleSubmit = async () => {
    if (!shopName.trim() || !address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên shop và địa chỉ.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await applyShop({
        shopName: shopName.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
      });
      setShop(result);
      Alert.alert('Thành công', 'Đơn đăng ký đã được gửi, vui lòng chờ admin duyệt.');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không gửi được đơn đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} color="#2B5CE6" />;

  const isPending = shop?.status === 'pending';
  const isApproved = shop?.status === 'approved';
  const isRejected = shop?.status === 'rejected';
  const formDisabled = isPending || isApproved;

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="KÊNH NGƯỜI BÁN" hideRightIcon />
      <ScrollView contentContainerStyle={styles.content}>

        {isApproved && (
          <View style={[styles.banner, styles.bannerOk]}>
            <Text style={styles.bannerOkText}>✓ Shop của bạn đã được duyệt. Bạn có thể đăng sản phẩm lên app.</Text>
          </View>
        )}
        {isPending && (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Text style={styles.bannerWarnText}>⏳ Đơn đăng ký đang chờ admin duyệt. Vui lòng quay lại sau.</Text>
          </View>
        )}
        {isRejected && (
          <View style={[styles.banner, styles.bannerErr]}>
            <Text style={styles.bannerErrText}>
              ✕ Đơn đăng ký đã bị từ chối.{shop?.rejectReason ? `\nLý do: ${shop.rejectReason}` : ''}
              {'\n'}Bạn có thể chỉnh sửa và gửi lại bên dưới.
            </Text>
          </View>
        )}
        {!shop && (
          <Text style={styles.intro}>
            Đăng ký trở thành người bán để đăng sản phẩm lên KiraLabs và nhận thêm Credit khi sản phẩm được duyệt.
          </Text>
        )}

        <Text style={styles.label}>Tên shop *</Text>
        <TextInput
          style={[styles.input, formDisabled && styles.inputDisabled]}
          value={shopName} onChangeText={setShopName}
          editable={!formDisabled} placeholder="VD: Kira Fashion Store" placeholderTextColor="#999"
        />

        <Text style={styles.label}>Địa chỉ shop *</Text>
        <TextInput
          style={[styles.input, formDisabled && styles.inputDisabled]}
          value={address} onChangeText={setAddress}
          editable={!formDisabled} placeholder="VD: 123 Cầu Giấy, Hà Nội" placeholderTextColor="#999"
        />

        <Text style={styles.label}>Số điện thoại liên hệ</Text>
        <TextInput
          style={[styles.input, formDisabled && styles.inputDisabled]}
          value={phone} onChangeText={setPhone} keyboardType="phone-pad"
          editable={!formDisabled} placeholder="Không bắt buộc" placeholderTextColor="#999"
        />

        <Text style={styles.label}>Giới thiệu shop</Text>
        <TextInput
          style={[styles.input, styles.textArea, formDisabled && styles.inputDisabled]}
          value={description} onChangeText={setDescription} multiline
          editable={!formDisabled} placeholder="Mô tả ngắn về shop (không bắt buộc)" placeholderTextColor="#999"
        />

        {!formDisabled && (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.submitText}>{isRejected ? 'GỬI LẠI ĐƠN' : 'GỬI ĐƠN ĐĂNG KÝ'}</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 20, paddingBottom: 40 },
  intro: { fontFamily: 'Afacad-Regular', fontSize: 14, color: '#555', lineHeight: 21, marginBottom: 8 },
  banner: { padding: 14, borderRadius: 10, marginBottom: 18, borderWidth: 1 },
  bannerOk: { backgroundColor: '#F0FFF4', borderColor: '#9AE6B4' },
  bannerOkText: { color: '#22863A', fontSize: 13, lineHeight: 19, fontFamily: 'Afacad-Bold' },
  bannerWarn: { backgroundColor: '#FFFBEB', borderColor: '#FBD38D' },
  bannerWarnText: { color: '#B7791F', fontSize: 13, lineHeight: 19, fontFamily: 'Afacad-Bold' },
  bannerErr: { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' },
  bannerErrText: { color: '#C53030', fontSize: 13, lineHeight: 19, fontFamily: 'Afacad-Regular' },
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 15, fontFamily: 'Afacad-Bold' },
  input: { backgroundColor: '#F5F5F5', padding: 14, borderRadius: 8, color: '#1A1A1A', fontFamily: 'Afacad-Regular', fontSize: 15 },
  inputDisabled: { backgroundColor: '#EEE', color: '#999' },
  textArea: { height: 90, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2B5CE6', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 28 },
  submitText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});
