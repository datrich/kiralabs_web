import { API_URL } from '../config';
// src/screens/TryOnResultScreen.tsx
import React, {useMemo, useState} from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, StatusBar,
  SafeAreaView, Alert, ActivityIndicator, Platform, PermissionsAndroid,
} from 'react-native';
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import TabBar from '../components/TabBar';
import KiraHeader from '../components/KiraHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'TryOnResult'>;

function normalizeMobileUrl(url?: string) {
  if (!url) return undefined;
  return url
    .replace('http://localhost:8000', 'http://10.0.2.2:8000')
    .replace('http://127.0.0.1:8000', 'http://10.0.2.2:8000')
    .replace('http://localhost:3000', 'http://10.0.2.2:3000')
    .replace('http://127.0.0.1:3000', 'http://10.0.2.2:3000');
}

function getImageExtension(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.png')) return 'png';
  if (cleanUrl.endsWith('.webp')) return 'webp';
  return 'jpg';
}

async function requestSavePermission() {
  if (Platform.OS !== 'android') return true;
  const androidVersion = Number(Platform.Version);
  if (androidVersion >= 29) return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    { title: 'Save try-on image', message: 'Kira Labs cần quyền lưu ảnh.', buttonPositive: 'Allow', buttonNegative: 'Cancel' }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

const TryOnResultScreen: React.FC<Props> = ({navigation, route}) => {
  const resultImageUrl = useMemo(() => normalizeMobileUrl(route.params?.resultImageUrl), [route.params?.resultImageUrl]);
  const jobId = route.params?.jobId;
  
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false); // Trạng thái loading khi kiểm tra Email

  const handleGenerateVideo = async () => {
    try {
      setVerifying(true);
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/users/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      
      if (data.user && !data.user.isEmailVerified) {
        setVerifying(false);
        Alert.alert(
          'Yêu cầu xác minh Email', 
          'Chỉ tài khoản đã xác minh Gmail mới được sử dụng tính năng tạo Video AI để chống lạm dụng hệ thống.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xác minh ngay', onPress: () => navigation.navigate('Profile' as never) }
          ]
        );
        return;
      }
      
      setVerifying(false);
      // Chuyển sang màn hình cấu hình Video thực sự
      navigation.navigate('TryOnVideo' as never, { resultImageUrl, jobId } as never);
      
    } catch (e) {
      setVerifying(false);
      Alert.alert('Lỗi', 'Không thể kiểm tra thông tin tài khoản lúc này.');
    }
  };

  const handleSaveImage = async () => {
    if (!resultImageUrl) { Alert.alert('Chưa có ảnh', 'Không tìm thấy ảnh kết quả để lưu.'); return; }
    try {
      setSaving(true);
      const hasPermission = await requestSavePermission();
      if (!hasPermission) { Alert.alert('Thiếu quyền', 'Bạn cần cấp quyền lưu ảnh để tiếp tục.'); return; }

      let fileToSave = resultImageUrl;
      if (resultImageUrl.startsWith('http://') || resultImageUrl.startsWith('https://')) {
        const extension = getImageExtension(resultImageUrl);
        const localPath = `${RNFS.CachesDirectoryPath}/kira_tryon_${Date.now()}.${extension}`;
        const downloadResult = await RNFS.downloadFile({ fromUrl: resultImageUrl, toFile: localPath }).promise;
        if (downloadResult.statusCode && downloadResult.statusCode >= 400) throw new Error(`Download failed: ${downloadResult.statusCode}`);
        fileToSave = `file://${localPath}`;
      }
      await CameraRoll.save(fileToSave, { type: 'photo', album: 'Kira Labs' });
      Alert.alert('Đã lưu ảnh', 'Ảnh try-on đã được lưu vào thư viện máy.');
    } catch (error: any) {
      Alert.alert('Lỗi lưu ảnh', error.message || 'Không lưu được ảnh về máy.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KiraHeader onMenuPress={() => {}} onSearchPress={() => navigation.navigate('Search')} />
      <TabBar activeTab="tryOn" onTabChange={(tab) => {
        if (tab === 'home') navigation.navigate('Home');
        if (tab === 'forYou') navigation.navigate('ForYou');
      }} />

      <View style={styles.progressRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}><View style={[styles.progressFill, {width: '100%'}]} /></View>
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
        <Text style={styles.title}>Your try-on result</Text>
        {jobId ? <Text style={styles.jobText}>Job ID: {jobId}</Text> : null}

        <View style={styles.resultCard}>
          <Image source={ resultImageUrl ? {uri: resultImageUrl} : require('../assets/images/cat_dresses.jpg') } style={styles.resultImage} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} activeOpacity={0.86} disabled={saving || verifying} onPress={handleSaveImage}>
          {saving ? (
            <View style={styles.loadingRow}><ActivityIndicator color="#1A1A1A" /><Text style={styles.saveButtonText}>  SAVING...</Text></View>
          ) : ( <Text style={styles.saveButtonText}>SAVE IMAGE TO DEVICE</Text> )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, verifying && styles.disabledButton]} activeOpacity={0.86} disabled={saving || verifying} onPress={handleGenerateVideo}>
          {verifying ? (
            <View style={styles.loadingRow}><ActivityIndicator color="#FFFFFF" /><Text style={styles.actionButtonText}>  CHECKING...</Text></View>
          ) : ( <Text style={styles.actionButtonText}>GENERATE VIDEO NOW</Text> )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8, gap: 12 },
  backBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontFamily: 'Afacad-Regular', fontSize: 24, color: '#1A1A1A' },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E9E9E9', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#79C7E4', borderRadius: 99 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  stepLabel: { fontFamily: 'Afacad-Bold', fontSize: 11, fontWeight: '700', color: '#79C7E4', letterSpacing: 1.4, textAlign: 'center' },
  title: { fontFamily: 'Afacad-Bold', fontSize: 24, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginTop: 8 },
  jobText: { fontFamily: 'Afacad-Regular', fontSize: 11, color: '#999999', textAlign: 'center', marginTop: 8 },
  resultCard: { flex: 1, marginTop: 20, borderRadius: 18, backgroundColor: '#F5F5F5', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  resultImage: { width: '100%', height: '100%', backgroundColor: '#F5F5F5' },
  bottomBar: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, gap: 10 },
  saveButton: { height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#79C7E4', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontFamily: 'Afacad-Bold', color: '#1A1A1A', fontSize: 12, fontWeight: '700', letterSpacing: 1.1 },
  actionButton: { height: 52, borderRadius: 8, backgroundColor: '#79C7E4', alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontFamily: 'Afacad-Bold', color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  disabledButton: { opacity: 0.65 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
});

export default TryOnResultScreen;