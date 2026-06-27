// src/config.ts
import { Platform } from 'react-native';

// 🔧 Đổi URL backend ở ĐÚNG 1 chỗ này khi deploy hoặc chạy trên máy thật.
//  - Android emulator: 10.0.2.2 trỏ về localhost của máy tính.
//  - iOS simulator: localhost.
//  - Máy thật: thay bằng IP LAN của máy chạy server, vd 'http://192.168.1.10:3000'.
export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
