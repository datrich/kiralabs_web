import { API_URL } from '../config';
// src/screens/SearchScreen.tsx
// Màn search - Đã đồng bộ UI 100% với KiraHeader (Icon ⌕ nghiêng -12 độ + Cân bằng thanh Top)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category?: {
    name: string;
  };
}

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['dresses', 'Jeans']);
  
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim() !== '') {
        fetchSearchResults(query.trim());
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSearchResults = async (searchText: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(searchText)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Lỗi khi gọi API tìm kiếm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRecent = (item: string) => {
    setRecentSearches(prev => prev.filter(s => s !== item));
  };

  const handleClearAll = () => {
    setRecentSearches([]);
  };

  const handleSelectRecent = (item: string) => {
    setQuery(item);
  };

  const saveToRecent = (item: string) => {
    if (item.trim() !== '' && !recentSearches.includes(item)) {
      setRecentSearches(prev => [item, ...prev].slice(0, 5));
    }
  };

  const handleManualSubmit = () => {
    if (query.trim() !== '') {
      saveToRecent(query.trim());
      fetchSearchResults(query.trim());
    }
  };

  const hasRecent = recentSearches.length > 0;
  const isTyping = query.trim() !== '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={true} />

      {/* Search header - Được canh chỉnh giống hệt KiraHeader */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for items and brands"
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => saveToRecent(query)}
            autoFocus
          />
          {isTyping && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearInputBtn}>
               <Text style={styles.clearInputIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Nút Kính lúp y hệt màn Home */}
        <TouchableOpacity style={styles.iconButton} onPress={handleManualSubmit}>
          <Text style={styles.searchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      {!isTyping ? (
        hasRecent ? (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>RECENT SEARCH</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearText}>CLEAR</Text>
              </TouchableOpacity>
            </View>

            {recentSearches.map(item => (
              <View key={item} style={styles.recentItem}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleSelectRecent(item)}>
                  <Text style={styles.recentItemText}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveRecent(item)}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>⌕</Text>
            <Text style={styles.emptyText}>You have no recent searches</Text>
          </View>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.resultTitle}>KẾT QUẢ TÌM KIẾM CHO "{query}"</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#1A1A1A" style={{ marginTop: 20 }} />
          ) : results.length > 0 ? (
            results.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productItem} onPress={() => navigation.navigate('ProductDetail', {productId: product.id})}>
                <Image 
                  source={{ uri: product.imageUrl || 'https://via.placeholder.com/150' }} 
                  style={styles.productImage} 
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  {product.category && (
                    <Text style={styles.productCategory}>{product.category.name}</Text>
                  )}
                  {product.price && (
                    <Text style={styles.productPrice}>{product.price.toLocaleString('vi-VN')} đ</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF',
  },
  // Copy nguyên bản thông số từ KiraHeader.tsx để không bị lệch
  header: {
    height: Platform.OS === 'android' ? 82 : 76,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 16,
    paddingHorizontal: 24,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12, // Tạo khoảng cách đều giữa nút back, ô search và nút search
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 25,
    lineHeight: 30,
    color: '#1A1A1A',
  },
  searchIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 34,
    lineHeight: 36,
    color: '#1A1A1A',
    transform: [{rotate: '-12deg'}], // Nghiêng đúng góc của màn Home
  },
  searchBox: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontFamily: 'Afacad-Regular',
  },
  clearInputBtn: {
    padding: 4,
  },
  clearInputIcon: {
    fontSize: 14,
    color: '#999',
  },

  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: { 
    fontSize: 48, 
    marginBottom: 12, 
    color: '#999',
    transform: [{rotate: '-12deg'}],
  },
  emptyText: { fontSize: 13, color: '#999', fontFamily: 'Afacad-Regular' },

  scrollContent: { padding: 16 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
    fontFamily: 'Afacad-Bold',
  },
  clearText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 2,
    fontFamily: 'Afacad-Bold',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentItemText: { fontSize: 14, color: '#1A1A1A', fontFamily: 'Afacad-Regular' },
  removeIcon: { fontSize: 16, color: '#999', paddingHorizontal: 8 },

  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    marginBottom: 16,
    textTransform: 'uppercase',
    fontFamily: 'Afacad-Bold',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Afacad-Bold',
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Afacad-Regular',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53935',
    fontFamily: 'Afacad-Bold',
  },
});

export default SearchScreen;