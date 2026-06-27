import { API_URL } from '../config';
// src/screens/SignUpScreen.tsx
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

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;


const SignUpScreen: React.FC<Props> = ({navigation}) => {
  const [fullName, setFullName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const name = fullName.trim();
    const identifier = phoneOrEmail.trim();
    const pass = password.trim();

    if (!name || !identifier || !pass) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập Full name, email/số điện thoại và mật khẩu',
      );
      return;
    }

    if (pass.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu cần ít nhất 6 ký tự');
      return;
    }

    const isEmail = identifier.includes('@');

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: name,
          password: pass,
          email: isEmail ? identifier : undefined,
          phoneNumber: isEmail ? undefined : identifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Đăng ký lỗi', data.message || 'Không đăng ký được');
        return;
      }

      Alert.alert('Thành công', 'Đăng ký tài khoản thành công', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error) {
      console.log('REGISTER_ERROR:', error);
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
      source={require('../assets/images/signup_bg.png')}
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
          <Text style={styles.backText}>‹ Sign up</Text>
        </TouchableOpacity>

        <View style={styles.formArea}>
          <Text style={styles.title}>Create</Text>
          <Text style={styles.title}>new account</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="rgba(255,255,255,0.76)"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroupSmall}>
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

          <View style={styles.inputGroupSmall}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.76)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            <View style={styles.underline} />
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.divider}>or Sign up with</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              disabled={loading}
              onPress={() =>
                Alert.alert('Social Sign Up', 'Facebook (chưa làm)')
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
              onPress={() => Alert.alert('Social Sign Up', 'Google (chưa làm)')}>
              <Image
                source={require('../assets/icons/google_multicolor.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}>
            <Text style={styles.loginLink}>Log in</Text>
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

  inputGroupSmall: {
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

  signupButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 32,
  },

  disabledButton: {
    opacity: 0.7,
  },

  signupButtonText: {
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

  loginRow: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 38,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginText: {
    fontFamily: 'Afacad-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 8,
  },

  loginLink: {
    fontFamily: 'Afacad-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 8,
  },
});

export default SignUpScreen;
