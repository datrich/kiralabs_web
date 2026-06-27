// src/screens/ForYouScreen.tsx
// Màn For You - khuyến nghị sản phẩm cho user
// State empty: chưa có recommendation
// State filled: có grid sản phẩm

import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import TopBar from '../components/TopBar';
import TabBar from '../components/TabBar';

type Props = NativeStackScreenProps<RootStackParamList, 'ForYou'>;

const recommendedProducts = [
  {id: 1, image: require('../assets/images/cat_clothing.jpg'), price: '$ 43.00', brand: 'Nike Football Academy', name: 'dry short'},
  {id: 2, image: require('../assets/images/cat_dresses.jpg'), price: '$ 43.00', brand: 'Nike Football Academy', name: 'dry short'},
  {id: 3, image: require('../assets/images/cat_sportwear.jpg'), price: '$ 43.00', brand: 'Nike Football Academy', name: 'dry short'},
  {id: 4, image: require('../assets/images/cat_trending.jpg'), price: '$ 43.00', brand: 'Nike Football Academy', name: 'dry short'},
];

const ForYouScreen: React.FC<Props> = ({navigation}) => {
  // Đổi false → true để xem state filled
  const [hasRecommendations] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'tryOn') navigation.navigate('TryOnSelect');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <TopBar
        onMenuPress={() => console.log('Menu')}
        onSearchPress={() => navigation.navigate('Search')}
      />

      <TabBar activeTab="forYou" onTabChange={handleTabChange} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECOMANDED FOR YOU</Text>
      </View>

      {hasRecommendations ? (
        // FILLED STATE
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {recommendedProducts.map(product => {
              const isFav = favorites.includes(product.id);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => navigation.navigate('ProductDetail', {productId: product.id})}>
                  <Image source={product.image} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <View style={{flex: 1}}>
                      <Text style={styles.productPrice}>{product.price}</Text>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                      <Text style={styles.productName}>{product.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFavorite(product.id)}>
                      <Text style={[styles.heartIcon, isFav && styles.heartIconActive]}>
                        {isFav ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        // EMPTY STATE
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>Styles base on your shoping habits!</Text>
          <View style={styles.emptySpacer} />
          <Text style={styles.emptyText}>NOTHING YET... Why not have</Text>
          <Text style={styles.emptyText}>a browse to help curate some</Text>
          <Text style={styles.emptyText}>recommendations for you!</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeButtonText}>GO TO HOME</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF'},
  sectionHeader: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },

  // Empty state
  emptyContent: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    paddingTop: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  emptySpacer: {height: 40},
  emptyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  homeButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 80,
    marginTop: 24,
  },
  homeButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Filled state
  scrollContent: {padding: 12},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productCard: {
    width: '48.5%',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  productBrand: {fontSize: 11, color: '#666', marginTop: 2},
  productName: {fontSize: 11, color: '#666'},
  heartIcon: {fontSize: 20, color: '#999'},
  heartIconActive: {color: '#FF6B6B'},
});

export default ForYouScreen;