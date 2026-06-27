// src/screens/ProductsPageScreen.tsx
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
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import KiraHeader from '../components/KiraHeader';
import {getProducts, Product} from '../services/productApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductsPage'>;

const screenWidth = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 18;
const GAP = 12;
const CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING * 2 - GAP) / 2;

const ProductsPageScreen: React.FC<Props> = ({navigation, route}) => {
  const categoryName = route.params?.category || 'CLOTHING';
  const [activeTab, setActiveTab] = useState<'recommended' | 'filter'>('recommended');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getProducts({categoryName});
      setProducts(data);
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setLoading(true);
      load();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, categoryName]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KiraHeader
        title={categoryName}
        showBack
        onBackPress={() => navigation.goBack()}
        onSearchPress={() => navigation.navigate('Search')}
      />

      <View style={styles.tabRow}>
        <TouchableOpacity style={styles.tab} activeOpacity={0.82} onPress={() => setActiveTab('recommended')}>
          <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>RECOMMENDED</Text>
          {activeTab === 'recommended' ? <View style={styles.tabUnderline} /> : null}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} activeOpacity={0.82} onPress={() => setActiveTab('filter')}>
          <Text style={[styles.tabText, activeTab === 'filter' && styles.tabTextActive]}>FILTER</Text>
          {activeTab === 'filter' ? <View style={styles.tabUnderline} /> : null}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color="#1A1A1A" />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
          <Text style={styles.itemsCount}>{products.length} items found</Text>

          {activeTab === 'filter' ? (
            <View style={styles.filterBox}>
              <Text style={styles.filterTitle}>FILTERS ARE COMING SOON</Text>
              <Text style={styles.filterText}>
                Price, color, size and brand filters will be connected later.
              </Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có sản phẩm nào trong danh mục này.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  activeOpacity={0.86}
                  onPress={() =>
                    navigation.navigate('ProductDetail', {
                      productId: product.id,
                      category: categoryName,
                    })
                  }>
                  <View style={styles.imageBox}>
                    {product.imageUrl ? (
                      <Image source={{uri: product.imageUrl}} style={styles.productImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.productImage} />
                    )}
                  </View>

                  <View style={styles.productInfoRow}>
                    <View style={styles.productInfoLeft}>
                      <Text style={styles.productPrice}>{product.price != null ? `$ ${product.price}.00` : '—'}</Text>
                      <Text style={styles.productBrand} numberOfLines={1}>
                        {product.shopName || 'Kira Labs Collection'}
                      </Text>
                      <Text style={styles.productName} numberOfLines={1}>
                        {product.name}
                      </Text>
                    </View>
                    <Text style={styles.heartIcon}>♡</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  tabRow: {flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0', backgroundColor: '#FFFFFF'},
  tab: {flex: 1, alignItems: 'center', paddingTop: 14, paddingBottom: 12, position: 'relative'},
  tabText: {fontFamily: 'Afacad-Bold', fontSize: 12, fontWeight: '700', color: '#A0A0A0', letterSpacing: 0.7},
  tabTextActive: {color: '#1A1A1A'},
  tabUnderline: {position: 'absolute', bottom: 0, width: 86, height: 2, backgroundColor: '#1A1A1A', borderRadius: 99},
  scroll: {flex: 1, backgroundColor: '#FFFFFF'},
  scrollContent: {paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 34},
  itemsCount: {fontFamily: 'Afacad-Regular', fontSize: 12, color: '#A0A0A0', textAlign: 'center', paddingVertical: 14},
  grid: {flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: 20},
  productCard: {width: CARD_WIDTH},
  imageBox: {width: '100%', height: CARD_WIDTH * 1.24, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F3F3F3'},
  productImage: {width: '100%', height: '100%', backgroundColor: '#F0F0F0'},
  productInfoRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 9},
  productInfoLeft: {flex: 1, paddingRight: 8},
  productPrice: {fontFamily: 'Afacad-Bold', fontSize: 14, fontWeight: '700', color: '#1A1A1A'},
  productBrand: {fontFamily: 'Afacad-Regular', fontSize: 12, color: '#656565', marginTop: 2},
  productName: {fontFamily: 'Afacad-Regular', fontSize: 12, color: '#656565'},
  heartIcon: {fontSize: 20, lineHeight: 24, color: '#1A1A1A'},
  filterBox: {marginTop: 18, backgroundColor: '#F6F6F6', borderRadius: 12, padding: 20},
  filterTitle: {fontFamily: 'Afacad-Bold', fontSize: 14, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1},
  filterText: {fontFamily: 'Afacad-Regular', fontSize: 13, color: '#777777', lineHeight: 20, marginTop: 8},
  emptyBox: {marginTop: 60, alignItems: 'center'},
  emptyText: {fontFamily: 'Afacad-Regular', fontSize: 14, color: '#999'},
});

export default ProductsPageScreen;
