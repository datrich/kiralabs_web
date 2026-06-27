import { API_URL } from '../config';
// src/screens/HistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, StyleSheet, SafeAreaView, ScrollView, 
  ActivityIndicator, TouchableOpacity, Modal, Alert, Platform, PermissionsAndroid 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KiraHeader from '../components/KiraHeader';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

async function requestSavePermission() {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) >= 29) return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    { title: 'Cấp quyền lưu trữ', message: 'Kira Labs cần quyền để lưu file.', buttonPositive: 'OK' }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null); // State quản lý Modal Fullscreen
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/history`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.history) setHistory(data.history);
      } catch (e) {
        console.log('Lỗi fetch lịch sử', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Hàm tự nhận diện link đó là Video hay Ảnh
  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('video');
  };

  const handleSaveToDevice = async (mediaUrl: string) => {
    try {
      setSaving(true);
      const hasPermission = await requestSavePermission();
      if (!hasPermission) { Alert.alert('Lỗi', 'Thiếu quyền lưu trữ!'); return; }

      const isVid = isVideo(mediaUrl);
      const ext = isVid ? 'mp4' : 'jpg';
      const localPath = `${RNFS.CachesDirectoryPath}/kira_history_${Date.now()}.${ext}`;

      const downloadResult = await RNFS.downloadFile({ fromUrl: mediaUrl, toFile: localPath }).promise;

      if (downloadResult.statusCode === 200) {
        await CameraRoll.save(`file://${localPath}`, { type: isVid ? 'video' : 'photo', album: 'Kira Labs' });
        Alert.alert('Thành công', 'Đã lưu về thư viện máy của bạn.');
      } else {
        throw new Error('Download failed');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu file lúc này.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="LỊCH SỬ AI TRY-ON" hideRightIcon />
      
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>⏳ Đảm bảo quyền riêng tư: Tất cả ảnh & video sẽ tự động xóa vĩnh viễn khỏi Server sau 24 giờ.</Text>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 50 }} color="#2B5CE6" /> : (
        <ScrollView contentContainerStyle={styles.grid}>
          {history.length === 0 ? <Text style={styles.empty}>Chưa có lịch sử thử đồ.</Text> : 
            history.map(item => {
              const checkVideo = isVideo(item.imageUrl);
              return (
                <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.8} onPress={() => setSelectedMedia(item)}>
                  {checkVideo ? (
                    <View style={styles.videoThumbContainer}>
                      {/* Dùng luôn Video tag làm Thumbnail nhưng dừng chạy */}
                      <Video source={{ uri: item.imageUrl }} style={styles.img} paused={true} resizeMode="cover" muted={true} />
                      <View style={styles.playOverlay}><Text style={styles.playIcon}>▶</Text></View>
                    </View>
                  ) : (
                    <Image source={{ uri: item.imageUrl }} style={styles.img} />
                  )}
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleTimeString()} - {new Date(item.createdAt).toLocaleDateString()}</Text>
                </TouchableOpacity>
              )
            })
          }
        </ScrollView>
      )}

      {/* MODAL FULLSCREEN XEM CHI TIẾT */}
      <Modal visible={!!selectedMedia} transparent={true} animationType="fade" onRequestClose={() => setSelectedMedia(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMedia(null)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {selectedMedia && isVideo(selectedMedia.imageUrl) ? (
            <View style={styles.fullMediaContainer}>
              <Video source={{ uri: selectedMedia.imageUrl }} style={styles.fullMedia} controls={true} resizeMode="contain" repeat={true} />
            </View>
          ) : (
            <View style={styles.fullMediaContainer}>
              <Image source={{ uri: selectedMedia?.imageUrl }} style={styles.fullMedia} resizeMode="contain" />
            </View>
          )}

          <TouchableOpacity style={[styles.saveBtn, saving && {opacity: 0.6}]} disabled={saving} onPress={() => handleSaveToDevice(selectedMedia?.imageUrl)}>
            <Text style={styles.saveBtnText}>{saving ? 'ĐANG LƯU...' : 'LƯU VỀ MÁY'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  warningBox: { backgroundColor: '#F0F5FF', padding: 12, borderBottomWidth: 1, borderColor: '#D6E4FF' },
  warningText: { color: '#2B5CE6', fontSize: 12, textAlign: 'center', fontFamily: 'Afacad-Bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  card: { width: '48%', marginBottom: 15 },
  img: { width: '100%', aspectRatio: 0.8, borderRadius: 8, backgroundColor: '#E0E0E0' },
  date: { fontSize: 11, color: '#999', marginTop: 5, textAlign: 'center', fontFamily: 'Afacad-Regular' },
  
  // Style riêng cho Thumbnail Video
  videoThumbContainer: { position: 'relative', width: '100%', aspectRatio: 0.8, borderRadius: 8, overflow: 'hidden' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  playIcon: { color: '#FFF', fontSize: 30, opacity: 0.9 },

  // Style cho Modal Fullscreen
  modalBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: Platform.OS === 'android' ? 20 : 50, right: 20, zIndex: 10, padding: 10 },
  closeText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  fullMediaContainer: { width: '100%', height: '70%', justifyContent: 'center', alignItems: 'center' },
  fullMedia: { width: '100%', height: '100%' },
  saveBtn: { position: 'absolute', bottom: 40, backgroundColor: '#79C7E4', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 },
  saveBtnText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14, letterSpacing: 1 }
});