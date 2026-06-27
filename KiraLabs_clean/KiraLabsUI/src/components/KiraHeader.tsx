// src/components/KiraHeader.tsx
import React from 'react';
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  title?: string;
  hideRightIcon?: boolean;
  hasNotification?: boolean; // (giữ tương thích cũ)
  showBell?: boolean;
  notificationCount?: number;
  onBellPress?: () => void;
};

const KiraHeader: React.FC<Props> = ({
  onMenuPress,
  onSearchPress,
  showBack = false,
  onBackPress,
  title,
  hideRightIcon = false,
  hasNotification = false,
  showBell = false,
  notificationCount = 0,
  onBellPress,
}) => {
  return (
    <View style={[styles.header, title ? styles.headerWithTitle : null]}>
      <TouchableOpacity
        style={styles.iconButton}
        activeOpacity={0.75}
        onPress={showBack ? onBackPress : onMenuPress}>
        {/* Bọc icon menu lại để thêm dấu chấm đỏ */}
        <View>
          <Text style={showBack ? styles.backIcon : styles.menuIcon}>
            {showBack ? '←' : '☰'}
          </Text>
          {/* Nếu có thông báo và đang ở màn Home (không có nút back) thì hiện chấm đỏ */}
          {hasNotification && !showBack && <View style={styles.redDot} />}
        </View>
      </TouchableOpacity>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.logoBox} pointerEvents="none">
          <Image
            source={require('../assets/images/kiralabs_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      <View style={styles.rightGroup}>
        {showBell && (
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={onBellPress}>
            <View>
              <Text style={styles.bellIcon}>🔔</Text>
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          disabled={hideRightIcon}
          onPress={onSearchPress}>
          {hideRightIcon ? null : <Text style={styles.searchIcon}>⌕</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'android' ? 82 : 76,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 16,
    paddingHorizontal: 24,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerWithTitle: {
    height: Platform.OS === 'android' ? 96 : 82,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 18 : 20,
    paddingBottom: 6,
  },

  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 30,
    lineHeight: 32,
    color: '#1A1A1A',
  },

  backIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 25,
    lineHeight: 30,
    color: '#1A1A1A',
  },

  searchIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 34,
    lineHeight: 36,
    color: '#1A1A1A',
    transform: [{rotate: '-12deg'}],
  },

  // CSS cho dấu chấm đỏ
  redDot: {
    position: 'absolute',
    top: 2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4F',
  },

  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  bellIcon: { fontSize: 20, lineHeight: 24 },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#FF4D4F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFF', fontSize: 9, fontFamily: 'Afacad-Bold', fontWeight: '700' },
  logoBox: {
    width: 150,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  logo: {
    width: 150,
    height: 42,
    transform: [{scale: 2.5}],
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Afacad-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 2.4,
    marginHorizontal: 8,
  },
});

export default KiraHeader;