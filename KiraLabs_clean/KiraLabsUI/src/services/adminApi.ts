import { API_URL } from '../config';
// src/services/adminApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShopStatus } from './shopApi';
import { Product, ProductStatus } from './productApi';


export type AdminShopApplicant = {
  id: number;
  shopName: string;
  address: string;
  phone?: string | null;
  description?: string | null;
  status: ShopStatus;
  rejectReason?: string | null;
  createdAt?: string | null;
  approvedAt?: string | null;
  user: {
    id: number;
    fullName: string;
    email?: string | null;
    phoneNumber?: string | null;
    role: string;
  } | null;
};

export type AdminStats = {
  totalUsers: number;
  byRole: { user: number; shop: number; admin: number };
  shops: { pending: number; approved: number };
  products: { total: number; pendingApproval: number };
};

async function authHeaders(extra: Record<string, string> = {}) {
  const token = await AsyncStorage.getItem('userToken');
  return { Authorization: `Bearer ${token}`, ...extra };
}

// Danh sách đơn shop. status để trống = tất cả
export async function getAdminShops(status?: ShopStatus): Promise<AdminShopApplicant[]> {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`${API_URL}/admin/shops${qs}`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được danh sách shop');
  return data.shops || [];
}

export async function approveShop(shopId: number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/shops/${shopId}/approve`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Duyệt shop thất bại');
}

export async function rejectShop(shopId: number, reason?: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/shops/${shopId}/reject`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ reason: reason || '' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Từ chối shop thất bại');
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/admin/stats`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được thống kê');
  return data.stats;
}

// ===== SUPER ADMIN: quản lý quyền admin =====
export type ManagedUser = {
  id: number;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  role: string;
  isSuperAdmin: boolean;
  credits: number;
};

export async function getUsers(search?: string): Promise<ManagedUser[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_URL}/admin/users${qs}`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được danh sách tài khoản');
  return data.users || [];
}

export async function promoteAdmin(userId: number): Promise<void> {
  const res = await fetch(`${API_URL}/superadmin/users/${userId}/promote-admin`, {
    method: 'POST', headers: await authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Cấp quyền admin thất bại');
}

export async function demoteAdmin(userId: number): Promise<void> {
  const res = await fetch(`${API_URL}/superadmin/users/${userId}/demote-admin`, {
    method: 'POST', headers: await authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Thu hồi quyền admin thất bại');
}

// ===== ADMIN: duyệt sản phẩm =====
export async function getAdminProducts(status: ProductStatus = 'pending'): Promise<Product[]> {
  const res = await fetch(`${API_URL}/admin/products?status=${status}`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được sản phẩm');
  return data.products || [];
}

export async function approveProduct(id: number): Promise<string> {
  const res = await fetch(`${API_URL}/admin/products/${id}/approve`, { method: 'POST', headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Duyệt sản phẩm thất bại');
  return data.message || 'Đã duyệt';
}

export async function rejectProduct(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/products/${id}/reject`, { method: 'POST', headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Từ chối sản phẩm thất bại');
}
