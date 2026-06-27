// src/screens/ChooseBodyScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import TabBar from '../components/TabBar';
import KiraHeader from '../components/KiraHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseBody'>;

const ChooseBodyScreen: React.FC<Props> = ({navigation, route}) => {
  const [bodyImageUri, setBodyImageUri] = useState<string | null>(null);
  const productId = route.params?.productId;

  const handlePickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });

      if (result.didCancel) {
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert('Không chọn được ảnh', 'Bạn thử chọn lại ảnh nhé.');
        return;
      }

      setBodyImageUri(uri);
    } catch (error: any) {
      Alert.alert('Lỗi chọn ảnh', error.message || 'Không mở được thư viện ảnh');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'front',
        quality: 0.9,
      });

      if (result.didCancel) {
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert('Không chụp được ảnh', 'Bạn thử lại nhé.');
        return;
      }

      setBodyImageUri(uri);
    } catch (error: any) {
      Alert.alert('Lỗi camera', error.message || 'Không mở được camera');
    }
  };

  const handleNext = () => {
    if (!bodyImageUri) {
      Alert.alert('Thiếu ảnh body', 'Bạn cần chọn hoặc chụp ảnh body trước.');
      return;
    }

    navigation.navigate('ChooseProduct', {
      bodyImageUri,
      productId,
    });
  };

  const handleTabChange = (tab: 'home' | 'tryOn' | 'forYou') => {
    if (tab === 'home') {
      navigation.navigate('Home');
    }

    if (tab === 'forYou') {
      navigation.navigate('ForYou');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KiraHeader
        onMenuPress={() => console.log('Menu')}
        onSearchPress={() => navigation.navigate('Search')}
      />

      <TabBar activeTab="tryOn" onTabChange={handleTabChange} />

      <View style={styles.progressRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.75}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: '33%'}]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
        <Text style={styles.title}>Choose a photo of your body</Text>
        <Text style={styles.subtitle}>
          Use a clear full-body photo so Kira Labs can generate a better try-on result.
        </Text>

        <TouchableOpacity
          style={[styles.uploadCard, bodyImageUri && styles.uploadCardFilled]}
          activeOpacity={0.86}
          onPress={handlePickFromGallery}>
          {bodyImageUri ? (
            <Image
              source={{uri: bodyImageUri}}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.uploadInner}>
              <Text style={styles.uploadIcon}>＋</Text>
              <Text style={styles.uploadTitle}>Select photo from gallery</Text>
              <Text style={styles.uploadText}>JPG or PNG, full-body photo preferred</Text>
            </View>
          )}
        </TouchableOpacity>

        {bodyImageUri ? (
          <TouchableOpacity
            style={styles.changeButton}
            activeOpacity={0.82}
            onPress={handlePickFromGallery}>
            <Text style={styles.changeButtonText}>CHANGE PHOTO</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.orText}>or</Text>
        )}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.86}
          onPress={handleTakePhoto}>
          <Text style={styles.secondaryButtonText}>GET IMAGE FROM CAMERA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !bodyImageUri && styles.actionButtonDisabled]}
          activeOpacity={0.86}
          disabled={!bodyImageUri}
          onPress={handleNext}>
          <Text style={styles.actionButtonText}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 24,
    color: '#1A1A1A',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E9E9E9',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#79C7E4',
    borderRadius: 99,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  stepLabel: {
    fontFamily: 'Afacad-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#79C7E4',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Afacad-Bold',
    fontSize: 23,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontFamily: 'Afacad-Regular',
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  uploadCard: {
    flex: 1,
    marginTop: 22,
    borderWidth: 1.6,
    borderColor: '#79C7E4',
    borderRadius: 18,
    borderStyle: 'dashed',
    backgroundColor: '#FCFEFF',
    overflow: 'hidden',
    minHeight: 330,
    maxHeight: 430,
  },
  uploadCardFilled: {
    borderStyle: 'solid',
    borderColor: '#E8E8E8',
    backgroundColor: '#F3F3F3',
  },
  uploadInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EAF8FD',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 34,
    color: '#79C7E4',
    lineHeight: 54,
  },
  uploadTitle: {
    fontFamily: 'Afacad-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  uploadText: {
    fontFamily: 'Afacad-Regular',
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  orText: {
    fontFamily: 'Afacad-Regular',
    fontSize: 13,
    color: '#999999',
    marginVertical: 16,
    textAlign: 'center',
  },
  changeButton: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  changeButtonText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#79C7E4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontFamily: 'Afacad-Bold',
    color: '#79C7E4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionButton: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#79C7E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    fontFamily: 'Afacad-Bold',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});

export default ChooseBodyScreen;
