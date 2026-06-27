import { API_URL } from '../config';
// src/services/notificationApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';


export type NotificationType =
  | 'shop_pending' | 'product_pending'
  | 'shop_approved' | 'shop_rejected'
  | 'product_approved' | 'product_rejected'
  | 'new_review' | 'verify_email'
  | 'admin_granted' | 'admin_revoked';

export type AppNotification = {
  id: number;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: any;
  isRead: number;
  createdAt?: string | null;
};

async function authHeaders() {
  const token = await AsyncStorage.getItem('userToken');
  return { Authorization: `Bearer ${token}` };
}

export async function getNotifications(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const res = await fetch(`${API_URL}/notifications`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được thông báo');
  return { notifications: data.notifications || [], unreadCount: data.unreadCount || 0 };
}

export async function getUnreadCount(): Promise<number> {
  try {
    const { unreadCount } = await getNotifications();
    return unreadCount;
  } catch {
    return 0;
  }
}

export async function markAllRead(): Promise<void> {
  await fetch(`${API_URL}/notifications/read-all`, { method: 'POST', headers: await authHeaders() });
}

export async function markRead(id: number): Promise<void> {
  await fetch(`${API_URL}/notifications/${id}/read`, { method: 'POST', headers: await authHeaders() });
}
