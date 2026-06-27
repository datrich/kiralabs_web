// src/screens/NewPasswordScreen.tsx
import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ImageBackground, SafeAreaView, Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NewPassword'>;

const NewPasswordScreen: React.FC<Props> = ({navigation}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleVerify = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }
    Alert.alert('Thành công', 'Mật khẩu đã được cập nhật!', [
      {text: 'OK', onPress: () => navigation.navigate('Login')},
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
          <Text style={styles.title}>Enter new password</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#AAA"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#AAA"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <View style={styles.underline} />
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
  inputGroup: {marginTop: 40},
  input: {fontSize: 16, color: '#FFF', paddingVertical: 12},
  underline: {height: 1, backgroundColor: 'rgba(255,255,255,0.3)'},
  verifyButton: {backgroundColor: '#2C2C2C', paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginTop: 60},
  verifyButtonText: {color: '#FFF', fontSize: 16, fontWeight: '600'},
});

export default NewPasswordScreen;