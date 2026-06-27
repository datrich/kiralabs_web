// src/screens/ProductDetailScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import KiraHeader from '../components/KiraHeader';
import {getProductDetail, Product} from '../services/productApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const productId = route.params?.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    (async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      try {
        setProduct(await getProductDetail(productId));
      } catch (e: any) {
        Alert.alert('Lỗi', e?.message || 'Không tải được sản phẩm');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const categoryTitle = route.params?.category || product?.categoryName || 'CLOTHING';

  const handleTryOn = () => {
    if (!product) return;
    if (!product.tryOnEnabled) {
      Alert.alert('Không khả dụng', 'Sản phẩm này chỉ để trưng bày, không thử đồ ảo được.');
      return;
    }
    // Vào thẳng luồng try-on với sản phẩm này; khách sẽ tự chọn/đổi ảnh của mình ở bước sau.
    navigation.navigate('ChooseBody', {productId: product.id});
  };

  const handleGoToStore = () => {
    if (!product?.shopId) {
      Alert.alert('Hàng chính hãng Kira', 'Sản phẩm này thuộc Kira Labs, không có trang shop riêng.');
      return;
    }
    navigation.navigate('Store', {shopId: product.shopId});
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <KiraHeader title={categoryTitle} showBack onBackPress={() => navigation.goBack()} onSearchPress={() => navigation.navigate('Search')} />
        <ActivityIndicator style={{marginTop: 50}} color="#1A1A1A" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <KiraHeader title={categoryTitle} showBack onBackPress={() => navigation.goBack()} onSearchPress={() => navigation.navigate('Search')} />
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={styles.detailText}>Không tìm thấy sản phẩm.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KiraHeader title={categoryTitle} showBack onBackPress={() => navigation.goBack()} onSearchPress={() => navigation.navigate('Search')} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          {product.imageUrl ? (
            <Image source={{uri: product.imageUrl}} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImage} />
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.productName}>{product.shopName || 'Kira Labs Collection'} {product.name}</Text>
              <Text style={styles.categoryText}>{product.categoryName || ''}</Text>
            </View>

            <View style={styles.iconActions}>
              <TouchableOpacity style={styles.smallIconBtn} activeOpacity={0.75} onPress={() => setFavorite(prev => !prev)}>
                <Text style={[styles.heartIcon, favorite && styles.heartIconActive]}>{favorite ? '♥' : '♡'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallIconBtn} activeOpacity={0.75}>
                <Text style={styles.shareIcon}>↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.price}>{product.price != null ? `$ ${product.price}.00` : '—'}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.stars}>{'★★★★★'.split('').map((_, i) => (i < Math.round((product as any).avgRating || 0) ? '★' : '☆')).join('')}</Text>
            <Text style={styles.ratingText}>{((product as any).avgRating || 0).toFixed(1)} ({(product as any).reviewCount || 0})</Text>
          </View>

          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.selector} activeOpacity={0.82}>
              <Text style={styles.selectorLabel}>Color</Text>
              <Text style={styles.selectorArrow}>▾</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selector} activeOpacity={0.82}>
              <Text style={styles.selectorLabel}>Size</Text>
              <Text style={styles.selectorArrow}>▾</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.tryOnButton} activeOpacity={0.86} onPress={handleTryOn}>
            <Text style={styles.tryOnButtonText}>TRY-ON THIS PRODUCT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.storeButton} activeOpacity={0.86} onPress={handleGoToStore}>
            <Text style={styles.storeButtonText}>GO TO STORE</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>PRODUCT DETAILS</Text>
          <Text style={styles.detailText}>{product.description || 'Chưa có mô tả.'}</Text>
          {!!product.clothType && (
            <Text style={styles.detailBullet}>• Virtual try-on type: {product.clothType.toUpperCase()}</Text>
          )}
          {!!product.shopName && <Text style={styles.detailBullet}>• Shop: {product.shopName}</Text>}
          {!!product.shopAddress && <Text style={styles.detailBullet}>• Địa chỉ: {product.shopAddress}</Text>}

          <TouchableOpacity style={styles.viewReviewsBtn} activeOpacity={0.82} onPress={() => navigation.navigate('ViewReview', {productId: product.id})}>
            <Text style={styles.viewReviewsText}>VIEW ALL REVIEWS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  scroll: {flex: 1, backgroundColor: '#FFFFFF'},
  scrollContent: {paddingBottom: 36},
  heroCard: {marginHorizontal: 16, marginTop: 10, height: 420, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F3F3'},
  productImage: {width: '100%', height: '100%', backgroundColor: '#F0F0F0'},
  infoCard: {marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0F0F0'},
  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  titleLeft: {flex: 1, paddingRight: 12},
  productName: {fontFamily: 'Afacad-Bold', fontSize: 17, fontWeight: '700', color: '#1A1A1A', lineHeight: 22},
  categoryText: {fontFamily: 'Afacad-Regular', fontSize: 12, color: '#999999', marginTop: 4, letterSpacing: 0.7},
  iconActions: {flexDirection: 'row', gap: 4},
  smallIconBtn: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#F7F7F7', justifyContent: 'center', alignItems: 'center'},
  heartIcon: {fontSize: 20, lineHeight: 23, color: '#1A1A1A'},
  heartIconActive: {color: '#D34A4A'},
  shareIcon: {fontSize: 16, color: '#1A1A1A'},
  price: {fontFamily: 'Afacad-Bold', fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginTop: 12},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8},
  stars: {fontSize: 14, color: '#FFB400', letterSpacing: 1},
  ratingText: {fontFamily: 'Afacad-Regular', fontSize: 13, color: '#777777'},
  selectorRow: {flexDirection: 'row', gap: 12, marginTop: 18},
  selector: {flex: 1, height: 46, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E6E6E6', borderRadius: 8, paddingHorizontal: 14, backgroundColor: '#FFFFFF'},
  selectorLabel: {fontFamily: 'Afacad-Regular', fontSize: 13, color: '#1A1A1A'},
  selectorArrow: {fontSize: 12, color: '#777777'},
  tryOnButton: {backgroundColor: '#79C7E4', height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 18},
  tryOnButtonText: {fontFamily: 'Afacad-Bold', color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.2},
  storeButton: {backgroundColor: '#CF4646', height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10},
  storeButtonText: {fontFamily: 'Afacad-Bold', color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.2},
  divider: {height: 1, backgroundColor: '#EFEFEF', marginTop: 22, marginBottom: 18},
  sectionTitle: {fontFamily: 'Afacad-Bold', fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1},
  detailText: {fontFamily: 'Afacad-Regular', fontSize: 13, color: '#666666', lineHeight: 20, marginTop: 10},
  detailBullet: {fontFamily: 'Afacad-Regular', fontSize: 13, color: '#666666', lineHeight: 20, marginTop: 4},
  viewReviewsBtn: {marginTop: 18, height: 46, borderWidth: 1, borderColor: '#E3E3E3', borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  viewReviewsText: {fontFamily: 'Afacad-Bold', fontSize: 12, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1},
});

export default ProductDetailScreen;
