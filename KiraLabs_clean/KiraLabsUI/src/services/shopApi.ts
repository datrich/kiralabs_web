import { API_URL } from '../config';
// src/services/shopApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';


export type ShopStatus = 'pending' | 'approved' | 'rejected';

export type Shop = {
  id: number;
  shopName: string;
  address: string;
  phone?: string | null;
  description?: string | null;
  status: ShopStatus;
  rejectReason?: string | null;
  createdAt?: string | null;
  approvedAt?: string | null;
};

async function authHeaders(extra: Record<string, string> = {}) {
  const token = await AsyncStorage.getItem('userToken');
  return { Authorization: `Bearer ${token}`, ...extra };
}

// Lấy hồ sơ shop của chính mình (null nếu chưa đăng ký)
export async function getMyShop(): Promise<Shop | null> {
  const res = await fetch(`${API_URL}/shop/me`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được hồ sơ shop');
  return data.shop || null;
}

// Nộp đơn đăng ký shop (hoặc nộp lại nếu trước đó bị từ chối)
export async function applyShop(payload: {
  shopName: string;
  address: string;
  phone?: string;
  description?: string;
}): Promise<Shop> {
  const res = await fetch(`${API_URL}/shop/apply`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gửi đơn đăng ký thất bại');
  return data.shop;
}
