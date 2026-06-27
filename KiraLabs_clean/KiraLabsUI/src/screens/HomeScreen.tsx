import { API_URL } from '../config';
// src/screens/HomeScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageSourcePropType, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Modal, Animated, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import TabBar from '../components/TabBar';
import KiraHeader from '../components/KiraHeader';
import { getUnreadCount } from '../services/notificationApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type TabName = 'home' | 'tryOn' | 'forYou';


type HomeCategory = { id: number; label: string; slug: string; imageUrl: string; sortOrder: number; };
type HomeBanner = { id: number; title: string; subtitle?: string | null; buttonText?: string | null; target?: string | null; imageUrl: string; };
type RecommendedProduct = { id: number; imageUrl: string; price: string; brand: string; name: string; };
type TryOnProduct = { id: number; imageSource: ImageSourcePropType; clothType?: string; };

function normalizeMobileUrl(url?: string | null) {
  if (!url) return '';
  return String(url).replace('http://localhost:3000', API_URL).replace('http://127.0.0.1:3000', API_URL);
}

const HomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState<TabName>(route.params?.initialTab || 'home');
  const [tryOnProductId, setTryOnProductId] = useState<number | undefined>(route.params?.productId);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [banner, setBanner] = useState<HomeBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  // ==========================================
  // STATE LƯU THÔNG TIN USER TỪ DATABASE
  // ==========================================
  const [userCredits, setUserCredits] = useState(0);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-320)).current; 

  const openMenu = () => {
    setIsMenuVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, { toValue: -320, duration: 250, useNativeDriver: true }).start(() => setIsMenuVisible(false));
  };

  // Hàm lấy thông tin user thực tế từ Backend
  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.user) {
        setUserCredits(data.user.credits || 0); // Lấy số credit
        setUserInfo(data.user); // Lấy tên, email, isEmailVerified
      }
    } catch (error) {
      console.log('Lỗi khi lấy thông tin user:', error);
    }
  };

  const loadHomeContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/home-content`);
      const data = await response.json();
      if (!response.ok) { Alert.alert('Lỗi home', data.message || 'Không tải được dữ liệu home'); return; }
      const normalizedCategories = (data.categories || []).map((item: HomeCategory) => ({ ...item, imageUrl: normalizeMobileUrl(item.imageUrl) }));
      const normalizedBanner = data.banner ? { ...data.banner, imageUrl: normalizeMobileUrl(data.banner.imageUrl) } : null;
      setCategories(normalizedCategories);
      setBanner(normalizedBanner);
    } catch (error) {
      console.log('HOME_CONTENT_ERROR:', error);
      Alert.alert('Lỗi kết nối', 'Không gọi được backend để tải ảnh Home.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    // Thêm listener để mỗi lần quay lại Home đều cập nhật số Credit và check dấu đỏ
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserInfo();
      getUnreadCount().then(setUnreadCount);
    });
    loadHomeContent(); 
    fetchUserInfo();
    getUnreadCount().then(setUnreadCount);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.initialTab) setActiveTab(route.params.initialTab);
    if (route.params?.productId) setTryOnProductId(route.params.productId);
  }, [route.params?.initialTab, route.params?.productId]);

  const selectedTryOnProducts = useMemo<TryOnProduct[]>(() => {
    return categories.slice(0, 2).map(category => ({ id: category.id, imageSource: { uri: category.imageUrl } }));
  }, [categories]);

  const recommendedProducts = useMemo<RecommendedProduct[]>(() => {
    return categories.slice(0, 4).map(category => ({ id: category.id, imageUrl: category.imageUrl, price: '$ 43.00', brand: 'Nike Football Academy', name: category.label.toLowerCase() }));
  }, [categories]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const renderLoading = () => (
    <View style={styles.loadingBox}><ActivityIndicator color="#1A1A1A" /><Text style={styles.loadingText}>Loading...</Text></View>
  );

  const renderHomeContent = () => {
    if (loading) return renderLoading();
    return (
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.cell} activeOpacity={0.82} onPress={() => navigation.navigate('ProductsPage', { category: cat.label })}>
              <Image source={{ uri: cat.imageUrl }} style={styles.cellImage} />
              <Text style={styles.cellLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {banner ? (
          <View style={styles.banner}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerSubtitle}>{(banner.subtitle || '').replace('\\n', '\n')}</Text>
              <TouchableOpacity style={styles.exploreButton} activeOpacity={0.82} onPress={() => setActiveTab('forYou')}><Text style={styles.exploreText}>{banner.buttonText || 'EXPLORE'}</Text></TouchableOpacity>
            </View>
            <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} />
          </View>
        ) : null}
        <View style={styles.bottomSpace} />
      </ScrollView>
    );
  };

  const renderTryOnContent = () => {
    if (loading) return renderLoading();
    const hasProducts = selectedTryOnProducts.length > 0;
    const emptyCellCount = Math.max(0, 4 - selectedTryOnProducts.length);

    if (!hasProducts) {
      return (
        <View style={styles.tryOnEmptyContent}>
          <View style={styles.emptyTop} /><Text style={styles.emptyTitle}>NO PRODUCT WAS CHOSEN</Text><Text style={styles.emptySubtitle}>TRY TO GET SOME PRODUCT YOU WANT</Text>
          <TouchableOpacity style={styles.homeButton} activeOpacity={0.82} onPress={() => setActiveTab('home')}><Text style={styles.homeButtonText}>GO TO HOME</Text></TouchableOpacity><View style={styles.emptyBottom} />
        </View>
      );
    }
    return (
      <View style={styles.tryOnFilledContent}>
        <View style={styles.gallery}>
          {selectedTryOnProducts.map(product => (<View key={product.id} style={styles.galleryCell}><Image source={product.imageSource} style={styles.galleryCellImage} /></View>))}
          {[...Array(emptyCellCount)].map((_, index) => (<View key={`empty-${index}`} style={[styles.galleryCell, styles.galleryCellEmpty]} />))}
        </View>
        <Text style={styles.filledText}>Choose a product to try-on now!</Text><Text style={styles.itemCount}>{selectedTryOnProducts.length} items</Text>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.82} onPress={() => navigation.navigate('ChooseBody', { productId: selectedTryOnProducts[0]?.id })}><Text style={styles.startButtonText}>START</Text></TouchableOpacity>
      </View>
    );
  };

  const renderForYouContent = () => {
    if (loading) return renderLoading();
    const hasRecommendations = recommendedProducts.length > 0;
    return (
      <View style={styles.forYouRoot}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>RECOMMENDED FOR YOU</Text></View>
        {hasRecommendations ? (
          <ScrollView contentContainerStyle={styles.forYouScrollContent}>
            <View style={styles.productGrid}>
              {recommendedProducts.map(product => {
                const isFav = favorites.includes(product.id);
                return (
                  <TouchableOpacity key={product.id} style={styles.productCard} activeOpacity={0.82}>
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <View style={styles.productTextBox}><Text style={styles.productPrice}>{product.price}</Text><Text style={styles.productBrand}>{product.brand}</Text><Text style={styles.productName}>{product.name}</Text></View>
                      <TouchableOpacity activeOpacity={0.75} onPress={() => toggleFavorite(product.id)}><Text style={[styles.heartIcon, isFav && styles.heartIconActive]}>{isFav ? '♥' : '♡'}</Text></TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.forYouEmptyContent}>
            <Text style={styles.emptyRecommendTitle}>Styles based on your shopping habits!</Text><View style={styles.emptySpacer} /><Text style={styles.emptyText}>NOTHING YET... Why not have a browse to help curate some recommendations for you!</Text>
            <TouchableOpacity style={styles.homeButton} activeOpacity={0.82} onPress={() => setActiveTab('home')}><Text style={styles.homeButtonText}>GO TO HOME</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Truyền prop hasNotification để hiển thị chấm đỏ ngoài màn chính */}
      <KiraHeader 
        onMenuPress={openMenu} 
        onSearchPress={() => navigation.navigate('Search')} 
        showBell
        notificationCount={unreadCount}
        onBellPress={() => navigation.navigate('Notifications' as any)}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'home' ? renderHomeContent() : activeTab === 'tryOn' ? renderTryOnContent() : renderForYouContent()}

      {/* DRAWER MENU */}
      <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu}>
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuCloseArea} activeOpacity={1} onPress={closeMenu} />
          
          <Animated.View style={[styles.sideMenuContainer, { transform: [{ translateX: slideAnim }] }]}>
            
            {/* User Profile */}
            <View style={styles.menuProfileHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {userInfo?.fullName ? userInfo.fullName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.menuUserName}>{userInfo?.fullName || 'Người dùng'}</Text>
                <Text style={styles.menuUserEmail}>{userInfo?.email || userInfo?.phoneNumber || ''}</Text>
              </View>
            </View>

            {/* Credit System Box */}
            <View style={styles.creditContainer}>
              <View style={styles.creditInfo}>
                <Text style={styles.creditIcon}>🪙</Text>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.creditLabel}>Số dư tín dụng AI</Text>
                  <Text style={styles.creditValue}>{userInfo?.role === 'admin' ? 'Không giới hạn' : `${userCredits} Credits`}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.buyCreditBtn} onPress={() => { closeMenu(); Alert.alert('Nâng cấp', 'Chuyển sang màn hình mua gói nạp Credits'); }}>
                <Text style={styles.buyCreditText}>Nạp thêm</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Links */}
            <ScrollView style={styles.menuLinks}>
              
              <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Profile' as any); }}>
                <Text style={styles.menuRowIcon}>👤</Text>
                <Text style={styles.menuRowText}>Hồ sơ cá nhân</Text>
                {/* Dấu chấm đỏ trong Menu */}
                {userInfo && !userInfo.isEmailVerified && <View style={[styles.redDot, { position: 'relative', marginLeft: 10, top: 0, right: 0 }]} />}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuRow} onPress={closeMenu}>
                <Text style={styles.menuRowIcon}>❤️</Text>
                <Text style={styles.menuRowText}>Sản phẩm yêu thích</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('History' as any); }}>
                <Text style={styles.menuRowIcon}>🕒</Text>
                <Text style={styles.menuRowText}>Lịch sử AI Try-On</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* ===== MỤC THEO ROLE ===== */}
              {/* USER: đăng ký bán hàng */}
              {userInfo?.role === 'user' && (
                <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('ShopApply' as any); }}>
                  <Text style={styles.menuRowIcon}>🏪</Text>
                  <Text style={styles.menuRowText}>Đăng ký bán hàng (Shop)</Text>
                </TouchableOpacity>
              )}

              {/* SHOP: kênh người bán */}
              {userInfo?.role === 'shop' && (
                <>
                  <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('ShopApply' as any); }}>
                    <Text style={styles.menuRowIcon}>🏪</Text>
                    <Text style={[styles.menuRowText, { color: '#2B5CE6', fontWeight: 'bold' }]}>Kênh người bán</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('ShopProducts' as any); }}>
                    <Text style={styles.menuRowIcon}>📦</Text>
                    <Text style={[styles.menuRowText, { color: '#2B5CE6', fontWeight: 'bold' }]}>Sản phẩm của tôi</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ADMIN: duyệt shop + thống kê */}
              {userInfo?.role === 'admin' && (
                <>
                  <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('AdminShops' as any); }}>
                    <Text style={styles.menuRowIcon}>✅</Text>
                    <Text style={[styles.menuRowText, { color: '#D69E2E', fontWeight: 'bold' }]}>Duyệt đăng ký Shop</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('AdminProducts' as any); }}>
                    <Text style={styles.menuRowIcon}>📦</Text>
                    <Text style={[styles.menuRowText, { color: '#D69E2E', fontWeight: 'bold' }]}>Duyệt sản phẩm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('AdminStats' as any); }}>
                    <Text style={styles.menuRowIcon}>📊</Text>
                    <Text style={[styles.menuRowText, { color: '#D69E2E', fontWeight: 'bold' }]}>Thống kê hệ thống</Text>
                  </TouchableOpacity>
                  {userInfo?.isSuperAdmin && (
                    <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('UserAdmin' as any); }}>
                      <Text style={styles.menuRowIcon}>👑</Text>
                      <Text style={[styles.menuRowText, { color: '#9333EA', fontWeight: 'bold' }]}>Quản lý Admin</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {(userInfo?.role === 'user' || userInfo?.role === 'shop' || userInfo?.role === 'admin') && (
                <View style={styles.menuDivider} />
              )}

              <TouchableOpacity style={styles.menuRow} onPress={closeMenu}>
                <Text style={styles.menuRowIcon}>💎</Text>
                <Text style={[styles.menuRowText, {color: '#2B5CE6', fontWeight: 'bold'}]}>Quản lý gói (Plans)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuRow} onPress={closeMenu}>
                <Text style={styles.menuRowIcon}>⚙️</Text>
                <Text style={styles.menuRowText}>Cài đặt hệ thống</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer / Logout */}
            <View style={styles.menuFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={async () => { 
                closeMenu(); 
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userInfo');
                navigation.replace('Login');
              }}>
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: 'Afacad-Regular', marginTop: 10, fontSize: 14, color: '#777777' },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 34 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 14, columnGap: 14, rowGap: 18 },
  cell: { width: '48%', alignItems: 'center' },
  cellImage: { width: '100%', height: 132, borderRadius: 3, backgroundColor: '#F0F0F0' },
  cellLabel: { fontFamily: 'Afacad-Bold', fontSize: 12, fontWeight: '700', color: '#1A1A1A', marginTop: 8, letterSpacing: 1.2 },
  banner: { flexDirection: 'row', marginHorizontal: 20, marginTop: 22, backgroundColor: '#F4F4F4', borderRadius: 2, overflow: 'hidden', minHeight: 150 },
  bannerLeft: { flex: 1, paddingHorizontal: 16, paddingVertical: 18, justifyContent: 'space-between' },
  bannerTitle: { fontFamily: 'Afacad-Bold', fontSize: 14, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.4 },
  bannerSubtitle: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#777777', marginTop: 10, lineHeight: 17 },
  exploreButton: { backgroundColor: '#1A1A1A', paddingVertical: 10, paddingHorizontal: 22, borderRadius: 1, alignSelf: 'flex-start', marginTop: 14 },
  exploreText: { fontFamily: 'Afacad-Bold', color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  bannerImage: { width: 126, height: '100%', backgroundColor: '#E0E0E0' },
  bottomSpace: { height: 34 },
  tryOnEmptyContent: { flex: 1, backgroundColor: '#F5F5F5', alignItems: 'center', paddingHorizontal: 32 },
  emptyTop: { flex: 1 },
  emptyTitle: { fontFamily: 'Afacad-Bold', fontSize: 14, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5, textAlign: 'center' },
  emptySubtitle: { fontFamily: 'Afacad-Regular', fontSize: 11, color: '#999', marginTop: 8, letterSpacing: 0.5, textAlign: 'center' },
  homeButton: { backgroundColor: '#1A1A1A', paddingVertical: 14, paddingHorizontal: 60, borderRadius: 2, marginTop: 24 },
  homeButtonText: { fontFamily: 'Afacad-Bold', color: '#FFF', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  emptyBottom: { flex: 1 },
  tryOnFilledContent: { padding: 16 },
  gallery: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  galleryCell: { flex: 1, aspectRatio: 1, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  galleryCellImage: { width: '100%', height: '100%' },
  galleryCellEmpty: { backgroundColor: '#E5E5E5' },
  filledText: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  itemCount: { fontFamily: 'Afacad-Regular', fontSize: 11, color: '#999', marginTop: 2 },
  startButton: { backgroundColor: '#7DC9E7', paddingVertical: 14, borderRadius: 4, alignItems: 'center', marginTop: 16, alignSelf: 'flex-end', paddingHorizontal: 40 },
  startButtonText: { fontFamily: 'Afacad-Bold', color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  forYouRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  sectionHeader: { padding: 16, backgroundColor: '#F5F5F5' },
  sectionTitle: { fontFamily: 'Afacad-Bold', fontSize: 13, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  forYouScrollContent: { padding: 12, paddingBottom: 34 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productCard: { width: '48.5%', marginBottom: 16 },
  productImage: { width: '100%', aspectRatio: 0.85, borderRadius: 4, backgroundColor: '#F0F0F0' },
  productInfo: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 6 },
  productTextBox: { flex: 1 },
  productPrice: { fontFamily: 'Afacad-Bold', fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  productBrand: { fontFamily: 'Afacad-Regular', fontSize: 11, color: '#666', marginTop: 2 },
  productName: { fontFamily: 'Afacad-Regular', fontSize: 11, color: '#666' },
  heartIcon: { fontSize: 20, color: '#999' },
  heartIconActive: { color: '#FF6B6B' },
  forYouEmptyContent: { flex: 1, paddingHorizontal: 32, alignItems: 'center', paddingTop: 24 },
  emptyRecommendTitle: { fontFamily: 'Afacad-Bold', fontSize: 16, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
  emptySpacer: { height: 40 },
  emptyText: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 22 },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  menuCloseArea: { flex: 1 },
  sideMenuContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 50 },
  menuProfileHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  menuUserName: { fontFamily: 'Afacad-Bold', fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  menuUserEmail: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#777777', marginTop: 2 },
  
  creditContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  creditInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  creditIcon: { fontSize: 32 },
  creditLabel: { fontFamily: 'Afacad-Regular', fontSize: 12, color: '#666' },
  creditValue: { fontFamily: 'Afacad-Bold', fontSize: 18, color: '#1A1A1A', fontWeight: '700', marginTop: 2 },
  buyCreditBtn: { backgroundColor: '#2B5CE6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buyCreditText: { fontFamily: 'Afacad-Bold', color: '#FFF', fontSize: 13, fontWeight: '600' },

  menuLinks: { flex: 1, paddingTop: 10 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  menuRowIcon: { fontSize: 20, marginRight: 16, width: 24, textAlign: 'center' },
  menuRowText: { fontFamily: 'Afacad-Regular', fontSize: 15, color: '#1A1A1A' },
  menuDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  menuFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  logoutButton: { backgroundColor: '#FFF1F1', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  logoutText: { fontFamily: 'Afacad-Bold', color: '#FF4D4F', fontSize: 14, fontWeight: '700' },
  
  // Style cho chấm đỏ
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4F',
  },
});

export default HomeScreen;