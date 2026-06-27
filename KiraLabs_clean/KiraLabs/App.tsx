import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ScreenName = 'home' | 'login' | 'signup';

const API_URL = 'http://10.0.2.2:3000';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');

  if (screen === 'login') {
    return <LoginScreen onBack={() => setScreen('home')} onGoSignUp={() => setScreen('signup')} />;
  }

  if (screen === 'signup') {
    return <SignUpScreen onBack={() => setScreen('login')} onGoLogin={() => setScreen('login')} />;
  }

  return <HomeScreen onLogin={() => setScreen('login')} onSignUp={() => setScreen('signup')} />;
}

function HomeScreen({
  onLogin,
  onSignUp,
}: {
  onLogin: () => void;
  onSignUp: () => void;
}) {
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground
        source={require('./assets/onboarding-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={onLogin}>
              <Text style={styles.loginText}>Log in</Text>
            </Pressable>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>KL</Text>
              </View>

              <Text style={styles.brandName}>Kira Labs</Text>
            </View>

            <Text style={styles.subtitle}>Explore the new world of AI try-on</Text>
          </View>

          <View style={styles.bottomArea}>
            <Pressable style={styles.button} onPress={onLogin}>
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>

            <View style={styles.signUpRow}>
              <Text style={styles.normalText}>Dont have an account? </Text>

              <Pressable onPress={onSignUp}>
                <Text style={styles.signUpText}>Sign up</Text>
              </Pressable>
            </View>

            <View style={styles.homeIndicator} />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function LoginScreen({
  onBack,
  onGoSignUp,
}: {
  onBack: () => void;
  onGoSignUp: () => void;
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Đăng nhập lỗi', data.message || 'Có lỗi xảy ra');
        return;
      }

      Alert.alert('Thành công', `Xin chào ${data.user.fullName}`);
      console.log('TOKEN:', data.token);
      console.log('USER:', data.user);
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không gọi được backend. Kiểm tra server local đã chạy chưa.');
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <View style={authStyles.topBar}>
        <Pressable
          onPress={onBack}
          style={authStyles.backButton}
        >
          <Text style={authStyles.backText} onPress={onBack}>
            ‹ Back
          </Text>
        </Pressable>
      </View>

      <View style={authStyles.content}>
        <Text style={authStyles.title}>Log into{'\n'}your account</Text>

        <TextInput
          style={authStyles.input}
          placeholder="Phone Number/Email"
          placeholderTextColor="#999"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <View style={authStyles.passwordRow}>
          <TextInput
            style={authStyles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable>
            <Text style={authStyles.forgotText}>Forget?</Text>
          </Pressable>
        </View>

        <Pressable style={authStyles.primaryButton} onPress={handleLogin}>
          <Text style={authStyles.primaryButtonText}>Log In</Text>
        </Pressable>

        <Text style={authStyles.orText}>or Log in with</Text>

        <View style={authStyles.socialRow}>
          <Pressable style={authStyles.socialButton}>
            <Text style={authStyles.socialText}>f  Facebook</Text>
          </Pressable>

          <Pressable style={authStyles.socialButton}>
            <Text style={authStyles.socialText}>G  Google</Text>
          </Pressable>
        </View>
      </View>

      <View style={authStyles.footer}>
        <View style={authStyles.footerRow}>
          <Text>Dont have an account? </Text>
          <Pressable onPress={onGoSignUp}>
            <Text style={authStyles.footerLink}>Sign up</Text>
          </Pressable>
        </View>

        <View style={authStyles.authHomeIndicator} />
      </View>
    </SafeAreaView>
  );
}

function SignUpScreen({
  onBack,
  onGoLogin,
}: {
  onBack: () => void;
  onGoLogin: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    try {
      const isEmail = identifier.includes('@');

      const body = isEmail
        ? { fullName, email: identifier, password }
        : { fullName, phoneNumber: identifier, password };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Đăng ký lỗi', data.message || 'Có lỗi xảy ra');
        return;
      }

      Alert.alert('Thành công', 'Tạo tài khoản xong, giờ đăng nhập nhé');
      onGoLogin();
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không gọi được backend. Kiểm tra server local đã chạy chưa.');
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <View style={authStyles.topBar}>
        <Pressable
          onPress={onBack}
          style={authStyles.backButton}
        >
          <Text style={authStyles.backText} onPress={onBack}>
            ‹ Back
          </Text>
        </Pressable>
      </View>

      <View style={authStyles.content}>
        <Text style={authStyles.title}>Create{'\n'}new account</Text>

        <TextInput
          style={authStyles.input}
          placeholder="Full name"
          placeholderTextColor="#999"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={authStyles.input}
          placeholder="Phone Number/Email"
          placeholderTextColor="#999"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <TextInput
          style={authStyles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={authStyles.primaryButton} onPress={handleSignUp}>
          <Text style={authStyles.primaryButtonText}>Sign Up</Text>
        </Pressable>

        <Text style={authStyles.orText}>or Sign up with</Text>

        <View style={authStyles.socialRow}>
          <Pressable style={authStyles.socialButton}>
            <Text style={authStyles.socialText}>f  Facebook</Text>
          </Pressable>

          <Pressable style={authStyles.socialButton}>
            <Text style={authStyles.socialText}>G  Google</Text>
          </Pressable>
        </View>
      </View>

      <View style={authStyles.footer}>
        <View style={authStyles.footerRow}>
          <Text>Already have an account? </Text>
          <Pressable onPress={onGoLogin}>
            <Text style={authStyles.footerLink}>Log in</Text>
          </Pressable>
        </View>

        <View style={authStyles.authHomeIndicator} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 70,
    paddingHorizontal: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 150,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 55,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#087BEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -2,
  },
  brandName: {
    color: '#087BEA',
    fontSize: 35,
    fontWeight: '800',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 40,
    paddingBottom: 22,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2F2F2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 46,
  },
  normalText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  homeIndicator: {
    width: 150,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
});

const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 80,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    height: 44,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 42,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 42,
  },
  input: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E2E2',
    color: '#222222',
    marginBottom: 20,
  },
  passwordRow: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E2E2',
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#222222',
  },
  forgotText: {
    color: '#999999',
    fontSize: 12,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#2F2F2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  orText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 13,
    marginTop: 26,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  socialButton: {
    width: 110,
    height: 40,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 22,
  },
  footerRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  footerLink: {
    fontWeight: '800',
    color: '#111111',
  },
  authHomeIndicator: {
    width: 110,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#DDDDDD',
  },
});
