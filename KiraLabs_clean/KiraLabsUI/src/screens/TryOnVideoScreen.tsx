import { API_URL } from '../config';
// src/screens/TryOnVideoScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, StatusBar, 
  TouchableOpacity, ActivityIndicator, Alert, Platform, 
  TextInput, KeyboardAvoidingView, ScrollView, PermissionsAndroid, Image 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import KiraHeader from '../components/KiraHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'TryOnVideo'>;

const API_BASE_URL = API_URL;

async function requestSavePermission() {
  if (Platform.OS !== 'android') return true;
  const androidVersion = Number(Platform.Version);
  if (androidVersion >= 29) return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    { title: 'Save video', message: 'Kira Labs cần quyền lưu video.', buttonPositive: 'Allow', buttonNegative: 'Cancel' }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

const TryOnVideoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { resultImageUrl } = route.params;
  
  const [status, setStatus] = useState<'input' | 'generating' | 'success' | 'fail'>('input');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const startGeneration = async () => {
    if (!userPrompt.trim()) {
      Alert.alert('Nhập Prompt', 'Vui lòng mô tả video bạn muốn tạo!');
      return;
    }

    try {
      setStatus('generating');
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${API_BASE_URL}/api/video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: resultImageUrl, prompt: userPrompt }),
      });
      const data = await response.json();
      
      if (data.success && data.taskId) {
        setTaskId(data.taskId);
        startPolling(data.taskId);
      } else {
        setStatus('fail');
        Alert.alert('Lỗi', data.message || 'Không thể bắt đầu tạo video.');
      }
    } catch (error) {
      setStatus('fail');
    }
  };

  const startPolling = (id: string) => {
    pollInterval.current = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_BASE_URL}/api/video/status/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();

        if (data.state === 'success' && data.videoUrl) {
          if (pollInterval.current) clearInterval(pollInterval.current);
          setVideoUrl(data.videoUrl);
          setStatus('success');

          // --- LOGIC MỚI: GỌI API LƯU LỊCH SỬ VIDEO ---
          const token = await AsyncStorage.getItem('userToken');
          fetch(`${API_BASE_URL}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ mediaUrl: data.videoUrl })
          }).catch(err => console.log('Lỗi lưu lịch sử video:', err));
          // --------------------------------------------

        } else if (data.state === 'fail') {
          if (pollInterval.current) clearInterval(pollInterval.current);
          setStatus('fail');
        }
      } catch (error) {
        console.log('POLLING_ERROR:', error);
      }
    }, 10000); 
  };

  const handleSaveVideo = async () => {
    if (!videoUrl) { Alert.alert('Chưa có video', 'Không tìm thấy video kết quả để lưu.'); return; }
    try {
      setSaving(true);
      const hasPermission = await requestSavePermission();
      if (!hasPermission) { Alert.alert('Thiếu quyền', 'Bạn cần cấp quyền lưu video để tiếp tục.'); return; }

      const localPath = `${RNFS.CachesDirectoryPath}/kira_video_${Date.now()}.mp4`;
      const downloadResult = await RNFS.downloadFile({ fromUrl: videoUrl, toFile: localPath }).promise;

      if (downloadResult.statusCode === 200) {
        await CameraRoll.save(`file://${localPath}`, { type: 'video', album: 'Kira Labs' });
        Alert.alert('Đã lưu video', 'Video của bạn đã được lưu vào thư viện máy.');
      } else { throw new Error('Download failed'); }
    } catch (error: any) {
      Alert.alert('Lỗi lưu video', 'Không thể tải video về máy.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KiraHeader onMenuPress={() => {}} onSearchPress={() => {}} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Motion Video</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {status === 'input' && (
            <View style={styles.inputStepContainer}>
              <View style={styles.previewContainer}><Image source={{ uri: resultImageUrl }} style={styles.previewImage} resizeMode="contain" /></View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Describe your video idea:</Text>
                <TextInput style={styles.textInput} placeholder="e.g., A cinematic shot, walking in Paris..." placeholderTextColor="#999" multiline numberOfLines={4} value={userPrompt} onChangeText={setUserPrompt} />
                <TouchableOpacity style={styles.generateBtn} onPress={startGeneration}><Text style={styles.generateBtnText}>GENERATE VIDEO</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {status === 'generating' && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#79C7E4" />
              <Text style={styles.statusText}>AI is bringing your style to life...</Text>
              <Text style={styles.subText}>This may take up to 2-3 minutes. Please do not close this screen.</Text>
            </View>
          )}

          {status === 'fail' && (
            <View style={styles.centerBox}>
              <Text style={[styles.statusText, { color: '#E53935' }]}>Failed to generate video</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => setStatus('input')}><Text style={styles.retryText}>TRY AGAIN</Text></TouchableOpacity>
            </View>
          )}

          {status === 'success' && videoUrl && (
            <View style={styles.videoContainer}>
              <Video source={{ uri: videoUrl }} style={styles.videoPlayer} resizeMode="contain" repeat={true} controls={true} />
            </View>
          )}
        </ScrollView>

        {status === 'success' && (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={[styles.secondaryButton, saving && styles.disabledButton]} onPress={() => setStatus('input')} disabled={saving}>
              <Text style={styles.secondaryButtonText}>TRY ANOTHER PROMPT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, saving && styles.disabledButton]} onPress={handleSaveVideo} disabled={saving}>
              {saving ? (
                <View style={styles.loadingRow}><ActivityIndicator color="#1A1A1A" /><Text style={styles.saveButtonText}>  SAVING...</Text></View>
              ) : ( <Text style={styles.actionButtonText}>SAVE VIDEO TO DEVICE</Text> )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 5 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#1A1A1A' },
  title: { fontFamily: 'Afacad-Bold', fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginLeft: 10 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  inputStepContainer: { flex: 1, width: '100%', paddingBottom: 20 },
  previewContainer: { width: '100%', height: 320, backgroundColor: '#F5F5F5', borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  previewImage: { width: '100%', height: '100%' },
  inputContainer: { width: '100%', marginTop: 20 },
  inputLabel: { fontFamily: 'Afacad-Bold', fontSize: 16, color: '#1A1A1A', marginBottom: 10 },
  textInput: { borderWidth: 1, borderColor: '#E9E9E9', borderRadius: 12, padding: 16, fontFamily: 'Afacad-Regular', fontSize: 15, color: '#1A1A1A', backgroundColor: '#F9F9F9', minHeight: 120, textAlignVertical: 'top' },
  generateBtn: { marginTop: 24, height: 52, borderRadius: 8, backgroundColor: '#79C7E4', alignItems: 'center', justifyContent: 'center' },
  generateBtnText: { fontFamily: 'Afacad-Bold', color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },
  centerBox: { alignItems: 'center', backgroundColor: '#F5F5F5', padding: 30, borderRadius: 18, marginTop: 20 },
  statusText: { fontFamily: 'Afacad-Bold', fontSize: 18, color: '#1A1A1A', marginTop: 20, textAlign: 'center' },
  subText: { fontFamily: 'Afacad-Regular', fontSize: 14, color: '#999', marginTop: 10, textAlign: 'center' },
  videoContainer: { flex: 1, minHeight: 300, width: '100%', marginVertical: 20, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  videoPlayer: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  bottomBar: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 10 },
  actionButton: { height: 52, borderRadius: 8, backgroundColor: '#79C7E4', alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontFamily: 'Afacad-Bold', color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  secondaryButton: { height: 52, borderRadius: 8, borderWidth: 1, borderColor: '#79C7E4', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  secondaryButtonText: { fontFamily: 'Afacad-Bold', color: '#79C7E4', fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  saveButtonText: { fontFamily: 'Afacad-Bold', color: '#1A1A1A', fontSize: 13, fontWeight: '700', letterSpacing: 1.1 },
  disabledButton: { opacity: 0.65 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  retryBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: '#79C7E4', borderRadius: 8 },
  retryText: { color: '#79C7E4', fontWeight: 'bold' }
});

export default TryOnVideoScreen;