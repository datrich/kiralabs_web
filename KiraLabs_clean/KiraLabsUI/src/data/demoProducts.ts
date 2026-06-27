// src/data/demoProducts.ts
import {ImageSourcePropType} from 'react-native';

export type ClothType = 'upper' | 'lower' | 'overall';

export type DemoProduct = {
  id: number;
  category: string;
  image: ImageSourcePropType;
  price: string;
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  clothType: ClothType;
  description: string;
};

export const demoProducts: DemoProduct[] = [
  {
    id: 1,
    category: 'DRESSES',
    image: require('../assets/images/cat_dresses.jpg'),
    price: '$ 43.00',
    brand: 'Kira Labs Collection',
    name: 'red flowing dress',
    rating: 4.2,
    reviewCount: 18,
    clothType: 'overall',
    description:
      'A statement red dress designed for a confident and elegant look. Suitable for party, outdoor and fashion try-on demos.',
  },
  {
    id: 2,
    category: 'CLOTHING',
    image: require('../assets/images/cat_clothing.jpg'),
    price: '$ 43.00',
    brand: 'Kira Labs Collection',
    name: 'red coat outfit',
    rating: 4.0,
    reviewCount: 12,
    clothType: 'upper',
    description:
      'A clean red coat look for casual styling. This item works well for upper-body virtual try-on.',
  },
  {
    id: 3,
    category: 'SPORTWEAR',
    image: require('../assets/images/cat_sportwear.jpg'),
    price: '$ 39.00',
    brand: 'Nike Football Academy',
    name: 'dry sport top',
    rating: 3.8,
    reviewCount: 9,
    clothType: 'upper',
    description:
      'A sporty item for active daily wear. Lightweight appearance and simple silhouette for testing try-on flow.',
  },
  {
    id: 4,
    category: 'TRENDING NOW',
    image: require('../assets/images/cat_trending.jpg'),
    price: '$ 55.00',
    brand: 'Kira Street Style',
    name: 'cream couple outfit',
    rating: 4.5,
    reviewCount: 21,
    clothType: 'overall',
    description:
      'A trending street-style outfit with a soft color palette. Good for homepage recommendation demo.',
  },
  {
    id: 5,
    category: 'SHOES',
    image: require('../assets/images/cat_shoes.jpg'),
    price: '$ 68.00',
    brand: 'Nike',
    name: 'white sneaker',
    rating: 4.1,
    reviewCount: 16,
    clothType: 'lower',
    description:
      'A clean white sneaker product card. Included as a demo product item for the shopping flow.',
  },
  {
    id: 6,
    category: 'ACCESSORIES',
    image: require('../assets/images/cat_accessories.jpg'),
    price: '$ 24.00',
    brand: 'Kira Accessories',
    name: 'gold necklace set',
    rating: 4.4,
    reviewCount: 14,
    clothType: 'upper',
    description:
      'A detailed accessories item for product browsing. This item is mainly for UI demo rather than try-on.',
  },
];

export function getProductById(productId?: number) {
  return demoProducts.find(product => product.id === productId) || demoProducts[0];
}
