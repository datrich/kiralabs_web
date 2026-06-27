import { API_URL } from '../config';
// src/services/reviewApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';


export type Review = {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
  userId: number;
  userName: string;
};

export type ReviewSummary = { average: number; count: number };

export async function getReviews(productId: number): Promise<{ summary: ReviewSummary; reviews: Review[] }> {
  const res = await fetch(`${API_URL}/api/products/${productId}/reviews`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không tải được đánh giá');
  return { summary: data.summary || { average: 0, count: 0 }, reviews: data.reviews || [] };
}

export async function submitReview(productId: number, rating: number, comment?: string): Promise<string> {
  const token = await AsyncStorage.getItem('userToken');
  const res = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment: comment || '' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gửi đánh giá thất bại');
  return data.message || 'Đã gửi đánh giá';
}
