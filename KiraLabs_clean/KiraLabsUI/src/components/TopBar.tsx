// src/components/TopBar.tsx
// Thanh top dùng chung cho cả app sau login
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

type Props = {
  onMenuPress?: () => void;
  onSearchPress?: () => void;
};

const TopBar: React.FC<Props> = ({onMenuPress, onSearchPress}) => {
  return (
    <View style={styles.container}>
      {/* Menu icon ☰ */}
      <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      {/* Logo giữa */}
      <View style={styles.logoWrap}>
        <View style={styles.logoSquare}>
          <Text style={styles.logoLetters}>KL</Text>
        </View>
        <Text style={styles.logoText}>Kira Labs</Text>
      </View>

      {/* Search icon */}
      <TouchableOpacity onPress={onSearchPress} style={styles.iconBtn}>
        <Text style={styles.searchIcon}>🔍</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 22,
    color: '#1A1A1A',
  },
  searchIcon: {
    fontSize: 18,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoSquare: {
    width: 28,
    height: 28,
    backgroundColor: '#2B5CE6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetters: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5CE6',
  },
});

export default TopBar;