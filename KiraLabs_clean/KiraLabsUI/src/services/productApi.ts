import { API_URL } from '../config';
// src/services/productApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';


export type ClothType = 'upper' | 'lower' | 'overall';
export type ProductStatus = 'pending' | 'approved' | 'rejected';

export type Category = { id: number; name: string; slug: string };

export type Product = {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  clothType?: ClothType | null;
  imageUrl?: string | null;
  categoryId: number;
  categoryName?: string | null;
  shopId?: number | null;
  shopName?: string | null;
  shopAddress?: string | null;
  isActive: number;
  isApproved: number;
  tryOnEnabled: number;
  status: ProductStatus;
  createdAt?: string | null;
  avgRating?: number;
  reviewCount?: number;
};

async function authHeaders(extra: Record<string, string> = {}) {
  const token = await AsyncStorage.getItem('userToken');
  return { Authorization: `Bearer ${token}`, ...extra };
}

function guessImageType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được danh mục');
  return data.categories || [];
}

// Shop tạo danh mục mới (hoặc trả về danh mục đã có nếu trùng)
export async function createCategory(name: string): Promise<Category> {
  const token = await AsyncStorage.getItem('userToken');
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Tạo danh mục thất bại');
  return data.category;
}

// Danh sách sản phẩm công khai (đã duyệt). Lọc theo category hoặc shop.
export async function getProducts(filter?: {
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  shopId?: number;
  tryOn?: boolean;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filter?.categoryId) params.append('categoryId', String(filter.categoryId));
  if (filter?.categoryName) params.append('categoryName', filter.categoryName);
  if (filter?.categorySlug) params.append('categorySlug', filter.categorySlug);
  if (filter?.shopId) params.append('shopId', String(filter.shopId));
  if (filter?.tryOn) params.append('tryOn', '1');
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_URL}/api/products${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được sản phẩm');
  return data.products || [];
}

export async function getProductDetail(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được sản phẩm');
  return data.product;
}

export async function getMyProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/shop/products`, { headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được sản phẩm');
  return data.products || [];
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE', headers: await authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Xóa sản phẩm thất bại');
}

export async function createProduct(payload: {
  name: string;
  categoryId: number;
  price?: string;
  clothType?: ClothType;
  description?: string;
  imageUri: string;
}): Promise<Product> {
  const form = new FormData();
  form.append('name', payload.name);
  form.append('categoryId', String(payload.categoryId));
  if (payload.price) form.append('price', payload.price);
  if (payload.clothType) form.append('clothType', payload.clothType);
  if (payload.description) form.append('description', payload.description);
  form.append('image', {
    uri: payload.imageUri,
    name: 'product.jpg',
    type: guessImageType(payload.imageUri),
  } as any);

  const token = await AsyncStorage.getItem('userToken');
  const res = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // KHÔNG set Content-Type để fetch tự thêm boundary
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Đăng sản phẩm thất bại');
  return data.product;
}
