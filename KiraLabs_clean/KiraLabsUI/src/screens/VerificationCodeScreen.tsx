// src/screens/VerificationCodeScreen.tsx
import React, {useState, useRef} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ImageBackground, SafeAreaView, Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyCode'>;

const VerificationCodeScreen: React.FC<Props> = ({navigation}) => {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChangeDigit = (text: string, index: number) => {
    if (text && !/^[0-9]$/.test(text)) return;
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length < 4) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ 4 chữ số');
      return;
    }
    Alert.alert('Thành công', `Mã ${fullCode} đã xác thực!`, [
      {text: 'OK', onPress: () => navigation.navigate('NewPassword')},
    ]);
  };

  return (
    <ImageBackground
      source={require('../assets/images/welcome_bg.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            Please type the verification code sent to{'\n'}Phone Number/Email
          </Text>

          <View style={styles.codeRow}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { inputRefs.current[index] = ref; }}
                style={styles.codeBox}
                value={digit}
                onChangeText={text => handleChangeDigit(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {flex: 1},
  overlay: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)'},
  container: {flex: 1},
  backButton: {width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginTop: 10},
  backIcon: {fontSize: 40, color: '#FFF', fontWeight: '300'},
  content: {flex: 1, paddingHorizontal: 32, paddingTop: 60},
  title: {fontSize: 26, fontWeight: '700', color: '#FFF', textAlign: 'center'},
  subtitle: {fontSize: 14, color: '#DDD', textAlign: 'center', marginTop: 12, lineHeight: 20},
  codeRow: {flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 50},
  codeBox: {
    width: 55, height: 55, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6, fontSize: 24, color: '#FFF', fontWeight: '600',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  verifyButton: {backgroundColor: '#2C2C2C', paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginTop: 60},
  verifyButtonText: {color: '#FFF', fontSize: 16, fontWeight: '600'},
});

export default VerificationCodeScreen;