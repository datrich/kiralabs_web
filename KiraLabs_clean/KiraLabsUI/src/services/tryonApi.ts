import { API_URL } from '../config';
// src/services/tryonApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ClothType = 'upper' | 'lower' | 'overall';

type RunTryOnParams = {
  personImageUri: string;
  clothType: ClothType;
  clothImageUri?: string;
  clothImageUrl?: string;
};

function guessImageType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function runTryOn({ personImageUri, clothImageUri, clothImageUrl, clothType }: RunTryOnParams) {
  const formData = new FormData();

  formData.append('person_image', {
    uri: personImageUri, name: 'person.jpg', type: guessImageType(personImageUri),
  } as any);

  if (clothImageUri) {
    formData.append('cloth_image', {
      uri: clothImageUri, name: 'cloth.jpg', type: guessImageType(clothImageUri),
    } as any);
  }

  if (clothImageUrl) { formData.append('cloth_image_url', clothImageUrl); }
  formData.append('cloth_type', clothType);

  // Lấy thẻ căn cước (Token)
  const token = await AsyncStorage.getItem('userToken');

  const response = await fetch(`${API_URL}/tryon`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}` // Gửi Token lên server
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Try-on failed');
  }

  return data.data;
}