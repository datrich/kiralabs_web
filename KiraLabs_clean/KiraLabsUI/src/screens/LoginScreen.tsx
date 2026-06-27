import { API_URL } from '../config';
// src/screens/LoginScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;


const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const identifier = phoneOrEmail.trim();

    if (!identifier || !password) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập email/số điện thoại và mật khẩu',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({identifier, password}),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Đăng nhập lỗi',
          data.message || 'Tài khoản hoặc mật khẩu không đúng',
        );
        return;
      }

      console.log('LOGIN TOKEN:', data.token);
      console.log('LOGIN USER:', data.user);

      // ==========================================
      // LƯU TOKEN & THÔNG TIN USER VÀO MÁY
      // ==========================================
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));

      // Chuyển sang màn Home sau khi lưu thành công
      navigation.navigate('Home');
    } catch (error) {
      console.log('LOGIN_ERROR:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không gọi được backend. Kiểm tra server local đã chạy chưa.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/login_bg.png')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover">
      <StatusBar hidden />

      <View style={styles.blackOverlay} pointerEvents="none" />

      <LinearGradient
        pointerEvents="none"
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        colors={[
          'rgba(0,0,0,1)',
          'rgba(0,0,0,1)',
          'rgba(0,0,0,0.98)',
          'rgba(0,0,0,0.90)',
          'rgba(0,0,0,0.74)',
          'rgba(0,0,0,0.54)',
          'rgba(0,0,0,0.34)',
        ]}
        locations={[0, 0.12, 0.24, 0.40, 0.58, 0.78, 1]}
        style={styles.mainGradient}
      />

      <LinearGradient
        pointerEvents="none"
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        colors={[
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.34)',
          'rgba(0,0,0,0.78)',
          'rgba(0,0,0,1)',
        ]}
        locations={[0, 0.36, 0.72, 1]}
        style={styles.bottomGradient}
      />

      <LinearGradient
        pointerEvents="none"
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        colors={[
          'rgba(0,0,0,0.74)',
          'rgba(0,0,0,0.36)',
          'rgba(0,0,0,0)',
        ]}
        locations={[0, 0.52, 1]}
        style={styles.leftGradient}
      />

      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          disabled={loading}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.formArea}>
          <Text style={styles.title}>Log into</Text>
          <Text style={styles.title}>your account</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Phone Number/Email"
              placeholderTextColor="rgba(255,255,255,0.76)"
              value={phoneOrEmail}
              onChangeText={setPhoneOrEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroupPassword}>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.76)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={loading}>
                <Text style={styles.forgetText}>Forget?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.underline} />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.divider}>or Log in with</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              disabled={loading}
              onPress={() =>
                Alert.alert('Social Login', 'Facebook (chưa làm)')
              }>
              <Image
                source={require('../assets/icons/facebook_white.png')}
                style={styles.facebookIcon}
                resizeMode="contain"
              />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              disabled={loading}
              onPress={() => Alert.alert('Social Login', 'Google (chưa làm)')}>
              <Image
                source={require('../assets/icons/google_multicolor.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Dont have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            disabled={loading}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },

  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.48,
  },

  blackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },

  mainGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '44%',
  },

  leftGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '82%',
  },

  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 32,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 14,
  },

  backText: {
    fontFamily: 'Afacad-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6,
  },

  formArea: {
    marginTop: 50,
  },

  title: {
    fontFamily: 'Afacad-Bold',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 8,
  },

  inputGroup: {
    marginTop: 42,
  },

  inputGroupPassword: {
    marginTop: 22,
  },

  input: {
    fontFamily: 'Afacad-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 0,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },

  underline: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  passwordInput: {
    flex: 1,
    paddingRight: 12,
  },

  forgetText: {
    fontFamily: 'Afacad-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },

  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 32,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    fontFamily: 'Afacad-SemiBold',
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
  },

  divider: {
    fontFamily: 'Afacad-Regular',
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255,255,255,0.96)',
    marginTop: 23,
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6,
  },

  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },

  socialButton: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: 'rgba(255,255,255,0.96)',
    borderRadius: 1,
    backgroundColor: 'rgba(0,0,0,0.26)',
    paddingHorizontal: 10,
  },

  facebookIcon: {
    width: 13,
    height: 26,
    marginRight: 9,
  },

  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 9,
  },

  socialText: {
    fontFamily: 'Afacad-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },

  signupRow: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 38,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  signupText: {
    fontFamily: 'Afacad-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 8,
  },

  signupLink: {
    fontFamily: 'Afacad-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 8,
  },
});

export default LoginScreen;