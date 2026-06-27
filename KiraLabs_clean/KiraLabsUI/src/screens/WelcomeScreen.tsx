import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Image,
  SafeAreaView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({navigation}) => {
  return (
    <ImageBackground
      source={require('../assets/images/welcome_bg.png')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={true} />

        <View style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Image
                source={require('../assets/images/kiralabs_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.tagline}>
              Explore the new world of AI try-on
            </Text>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.getStartButton}
              onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.getStartText}>Get Start</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Dont have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 28,
  },

  topBar: {
    alignItems: 'flex-end',
  },

  loginText: {
    fontFamily: 'Afacad-SemiBold',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },

  logoSection: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  logoBox: {
    width: 260,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginBottom: 10,
  },

  logoImage: {
    width: 260,
    height: 92,
    transform: [{scale: 1.8}],
  },

  tagline: {
    fontFamily: 'Afacad-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },

  bottomSection: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 42,
    alignItems: 'center',
  },

  getStartButton: {
    backgroundColor: '#2C2C2C',
    paddingVertical: 14,
    borderRadius: 2,
    width: '82%',
    alignItems: 'center',
  },

  getStartText: {
    fontFamily: 'Afacad-Bold',
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },

  signupRow: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  signupText: {
    fontFamily: 'Afacad-Regular',
    color: '#FFFFFF',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 5,
  },

  signupLink: {
    fontFamily: 'Afacad-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 5,
  },
});

export default WelcomeScreen;