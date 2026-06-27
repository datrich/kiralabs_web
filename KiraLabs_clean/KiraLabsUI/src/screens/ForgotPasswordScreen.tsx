import { API_URL } from '../config';
// src/screens/ForgotPasswordScreen.tsx
import React, {useRef, useState} from 'react';
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

type ForgotStep = 'email' | 'code' | 'newPassword';


const ForgotPasswordScreen: React.FC<Props> = ({navigation}) => {
  const [step, setStep] = useState<ForgotStep>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const codeRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const getBackgroundSource = () => {
    if (step === 'email') {
      return require('../assets/images/forgot_password_bg.png');
    }

    if (step === 'code') {
      return require('../assets/images/verification_bg.png');
    }

    return require('../assets/images/new_password_bg.png');
  };

  const getIdentifier = () => emailOrPhone.trim();

  const handleSendCode = async () => {
    const identifier = getIdentifier();

    if (!identifier) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email hoặc số điện thoại');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/forgot-password/send-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({identifier}),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Gửi mã lỗi', data.message || 'Không gửi được mã xác minh');
        return;
      }

      Alert.alert(
        'Đã gửi mã',
        data.message ||
          'Mã xác minh đã được gửi. Nếu chưa cấu hình email, xem mã trong terminal backend.',
      );

      setStep('code');
    } catch (error) {
      console.log('SEND_RESET_CODE_ERROR:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không gọi được backend. Kiểm tra server local đã chạy chưa.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(-1);
    const nextCode = [...code];

    nextCode[index] = cleanValue;
    setCode(nextCode);

    if (cleanValue && index < codeRefs.length - 1) {
      codeRefs[index + 1].current?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const identifier = getIdentifier();
    const joinedCode = code.join('');

    if (!identifier) {
      Alert.alert('Thiếu thông tin', 'Thiếu email hoặc số điện thoại');
      setStep('email');
      return;
    }

    if (joinedCode.length < 4) {
      Alert.alert('Thiếu mã xác minh', 'Vui lòng nhập đủ 4 số xác minh');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/forgot-password/verify-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier,
            code: joinedCode,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Xác minh lỗi', data.message || 'Mã xác minh không hợp lệ');
        return;
      }

      if (!data.resetToken) {
        Alert.alert('Lỗi', 'Backend không trả về resetToken');
        return;
      }

      setResetToken(data.resetToken);
      setStep('newPassword');
    } catch (error) {
      console.log('VERIFY_RESET_CODE_ERROR:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không gọi được backend. Kiểm tra server local đã chạy chưa.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      Alert.alert('Thiếu reset token', 'Vui lòng xác minh mã lại');
      setStep('code');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập mật khẩu mới và xác nhận mật khẩu',
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu cần ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Không khớp',
        'Mật khẩu xác nhận không trùng với mật khẩu mới',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/forgot-password/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resetToken,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Đổi mật khẩu lỗi', data.message || 'Không đổi được mật khẩu');
        return;
      }

      Alert.alert('Thành công', data.message || 'Đổi mật khẩu thành công', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error) {
      console.log('RESET_PASSWORD_ERROR:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không gọi được backend. Kiểm tra server local đã chạy chưa.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) {
      return;
    }

    if (step === 'newPassword') {
      setStep('code');
      return;
    }

    if (step === 'code') {
      setStep('email');
      return;
    }

    navigation.goBack();
  };

  const renderTitle = () => {
    if (step === 'email') {
      return (
        <>
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            We will send you a one time{'\n'}verification code
          </Text>
        </>
      );
    }

    if (step === 'code') {
      return (
        <>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            Please type the verification code sent to{'\n'}
            Phone Number/Email
          </Text>
        </>
      );
    }

    return <Text style={styles.title}>Enter new password</Text>;
  };

  const renderEmailStep = () => {
    return (
      <>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="rgba(255,255,255,0.76)"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <View style={styles.underline} />
        </View>

        <TouchableOpacity
          style={[styles.mainButton, loading && styles.disabledButton]}
          onPress={handleSendCode}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text style={styles.mainButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  const renderCodeStep = () => {
    return (
      <>
        <View style={styles.codeRow}>
          {code.map((item, index) => (
            <TextInput
              key={index}
              ref={codeRefs[index]}
              style={styles.codeInput}
              value={item}
              onChangeText={value => handleCodeChange(value, index)}
              onKeyPress={({nativeEvent}) =>
                handleCodeKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              editable={!loading}
              placeholder=""
              placeholderTextColor="rgba(255,255,255,0.76)"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.mainButton, loading && styles.disabledButton]}
          onPress={handleVerifyCode}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text style={styles.mainButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  const renderNewPasswordStep = () => {
    return (
      <>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="rgba(255,255,255,0.76)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!loading}
          />
          <View style={styles.underline} />
        </View>

        <View style={styles.inputGroupSmall}>
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="rgba(255,255,255,0.76)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
          <View style={styles.underline} />
        </View>

        <TouchableOpacity
          style={[styles.mainButton, loading && styles.disabledButton]}
          onPress={handleResetPassword}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text style={styles.mainButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <ImageBackground
      source={getBackgroundSource()}
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
          'rgba(0,0,0,0.96)',
          'rgba(0,0,0,0.82)',
          'rgba(0,0,0,0.58)',
          'rgba(0,0,0,0.38)',
        ]}
        locations={[0, 0.14, 0.3, 0.5, 0.76, 1]}
        style={styles.mainGradient}
      />

      <LinearGradient
        pointerEvents="none"
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        colors={[
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.34)',
          'rgba(0,0,0,0.82)',
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
          'rgba(0,0,0,0.54)',
          'rgba(0,0,0,0.22)',
          'rgba(0,0,0,0)',
        ]}
        locations={[0, 0.48, 1]}
        style={styles.leftGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              disabled={loading}
              onPress={handleBack}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>

            <View style={styles.content}>
              <View style={styles.header}>{renderTitle()}</View>

              <View style={styles.formArea}>
                {step === 'email' && renderEmailStep()}
                {step === 'code' && renderCodeStep()}
                {step === 'newPassword' && renderNewPasswordStep()}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },

  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.46,
  },

  blackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
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
    width: '80%',
  },

  safeArea: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 32,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  backIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 36,
    lineHeight: 36,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6,
  },

  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  header: {
    alignItems: 'center',
    marginTop: 48,
  },

  title: {
    fontFamily: 'Afacad-Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 8,
  },

  subtitle: {
    fontFamily: 'Afacad-Regular',
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 6,
  },

  formArea: {
    marginTop: 72,
  },

  inputGroup: {
    marginTop: 0,
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
    backgroundColor: 'rgba(255,255,255,0.68)',
  },

  mainButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 34,
  },

  disabledButton: {
    opacity: 0.7,
  },

  mainButtonText: {
    fontFamily: 'Afacad-SemiBold',
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
  },

  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },

  codeInput: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    color: '#FFFFFF',
    fontFamily: 'Afacad-SemiBold',
    fontSize: 23,
    fontWeight: '700',
    borderRadius: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
});

export default ForgotPasswordScreen;