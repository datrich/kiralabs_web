// src/screens/ChooseProductScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import TabBar from '../components/TabBar';
import KiraHeader from '../components/KiraHeader';
import {getProducts, getProductDetail, Product} from '../services/productApi';
import {runTryOn, ClothType} from '../services/tryonApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseProduct'>;

const CLOTH_TYPE_OPTIONS: {key: ClothType; label: string; helper: string}[] = [
  {key: 'upper', label: 'UPPER', helper: 'Top / shirt'},
  {key: 'lower', label: 'LOWER', helper: 'Pants / skirt'},
  {key: 'overall', label: 'OVERALL', helper: 'Dress / full outfit'},
];

const ChooseProductScreen: React.FC<Props> = ({navigation, route}) => {
  const bodyImageUri = route.params?.bodyImageUri;
  const routeProductId = route.params?.productId;

  const [appProducts, setAppProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customProductUri, setCustomProductUri] = useState<string | null>(null);
  const [customClothType, setCustomClothType] = useState<ClothType | null>(null);
  const [loading, setLoading] = useState(false);

  // Tải danh sách sản phẩm có thể try-on từ backend + preselect nếu có productId
  useEffect(() => {
    (async () => {
      try {
        const list = await getProducts({tryOn: true});
        setAppProducts(list);
      } catch (e) {}
      if (routeProductId) {
        try {
          const detail = await getProductDetail(routeProductId);
          if (detail.tryOnEnabled) setSelectedProduct(detail);
        } catch (e) {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeProductId]);

  const selectedClothType: ClothType | null = selectedProduct
    ? ((selectedProduct.clothType as ClothType) || null)
    : customClothType;

  const hasSelectedProduct = Boolean(
    (selectedProduct && selectedProduct.clothType) || (customProductUri && customClothType),
  );

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCustomProductUri(null);
    setCustomClothType(null);
  };

  const handleUploadOwnProduct = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      });

      if (result.didCancel) {
        return;
      }

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert('Không chọn được ảnh', 'Bạn thử chọn lại ảnh sản phẩm nhé.');
        return;
      }

      setCustomProductUri(uri);
      setSelectedProduct(null);
      setCustomClothType(null);
    } catch (error: any) {
      Alert.alert('Lỗi chọn ảnh', error.message || 'Không mở được thư viện ảnh');
    }
  };

  const handleStartGeneration = async () => {
    if (!bodyImageUri) {
      Alert.alert('Thiếu ảnh body', 'Bạn cần chọn ảnh body trước.');
      return;
    }

    if (!selectedProduct && !customProductUri) {
      Alert.alert('Thiếu sản phẩm', 'Bạn cần chọn hoặc upload ảnh sản phẩm trước.');
      return;
    }

    if (!selectedClothType) {
      Alert.alert(
        'Thiếu loại trang phục',
        'Bạn cần chọn UPPER, LOWER hoặc OVERALL cho ảnh sản phẩm tự upload.',
      );
      return;
    }

    try {
      setLoading(true);

      const result = await runTryOn({
        personImageUri: bodyImageUri,
        clothImageUri: customProductUri || undefined,
        clothImageUrl: customProductUri ? undefined : (selectedProduct?.imageUrl || undefined),
        clothType: selectedClothType,
      });

      const resultImageUrl =
        result.mobile_result_image_url || result.result_image_url;

      if (!resultImageUrl) {
        throw new Error('API không trả về result_image_url');
      }

      navigation.navigate('TryOnResult', {
        resultImageUrl,
        jobId: result.job_id,
      });
    } catch (error: any) {
      Alert.alert('Try-on lỗi', error.message || 'Không chạy được try-on');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'home' | 'tryOn' | 'forYou') => {
    if (tab === 'home') {
      navigation.navigate('Home');
    }

    if (tab === 'forYou') {
      navigation.navigate('ForYou');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KiraHeader
        onMenuPress={() => console.log('Menu')}
        onSearchPress={() => navigation.navigate('Search')}
      />

      <TabBar activeTab="tryOn" onTabChange={handleTabChange} />

      <View style={styles.progressRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.75}
          disabled={loading}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: '66%'}]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Choose an image of the product</Text>
        <Text style={styles.subtitle}>
          Select a product from the app, or upload your own clothing image.
        </Text>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>1. Use product from app</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.productRow}>
              {appProducts.slice(0, 8).map(product => {
                const active = selectedProduct?.id === product.id;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, active && styles.productCardActive]}
                    activeOpacity={0.85}
                    disabled={loading}
                    onPress={() => handleSelectProduct(product)}>
                    <Image source={{uri: product.imageUrl || ''}} style={styles.productImage} />
                    <View style={styles.productBadge}>
                      <Text style={styles.productBadgeText}>
                        {(product.clothType || '').toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.uploadMiniCard,
                  customProductUri && styles.productCardActive,
                ]}
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleUploadOwnProduct}>
                {customProductUri ? (
                  <Image
                    source={{uri: customProductUri}}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.uploadMiniInner}>
                    <Text style={styles.uploadPlus}>＋</Text>
                    <Text style={styles.uploadMiniText}>Upload</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>2. Or upload your own product image</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            activeOpacity={0.86}
            disabled={loading}
            onPress={handleUploadOwnProduct}>
            <Text style={styles.uploadButtonText}>UPLOAD PRODUCT IMAGE</Text>
          </TouchableOpacity>
        </View>

        {customProductUri ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>3. Select clothing type</Text>
            <View style={styles.typeGrid}>
              {CLOTH_TYPE_OPTIONS.map(option => {
                const active = customClothType === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.typeButton, active && styles.typeButtonActive]}
                    activeOpacity={0.84}
                    onPress={() => setCustomClothType(option.key)}>
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.typeHelper, active && styles.typeHelperActive]}>
                      {option.helper}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.selectedBox}>
          {selectedProduct ? (
            <>
              <Image source={{uri: selectedProduct.imageUrl || ''}} style={styles.selectedPreview} />
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedTitle}>{selectedProduct.name}</Text>
                <Text style={styles.selectedMeta}>
                  Type: {(selectedProduct.clothType || '').toUpperCase()}
                </Text>
              </View>
            </>
          ) : customProductUri ? (
            <>
              <Image
                source={{uri: customProductUri}}
                style={styles.selectedPreview}
                resizeMode="cover"
              />
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedTitle}>Uploaded product</Text>
                <Text style={styles.selectedMeta}>
                  Type: {customClothType ? customClothType.toUpperCase() : 'PLEASE SELECT'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptySelectedText}>
              Choose a product above, or upload your own clothing image.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!hasSelectedProduct || loading) && styles.actionButtonDisabled,
          ]}
          disabled={!hasSelectedProduct || loading}
          activeOpacity={0.86}
          onPress={handleStartGeneration}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.actionButtonText}>  GENERATING...</Text>
            </View>
          ) : (
            <Text style={styles.actionButtonText}>START GENERATION NOW</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontFamily: 'Afacad-Regular',
    fontSize: 24,
    color: '#1A1A1A',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E9E9E9',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#79C7E4',
    borderRadius: 99,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  stepLabel: {
    fontFamily: 'Afacad-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#79C7E4',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Afacad-Bold',
    fontSize: 23,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontFamily: 'Afacad-Regular',
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  sectionBlock: {
    marginTop: 22,
  },
  sectionTitle: {
    fontFamily: 'Afacad-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 6,
  },
  productCard: {
    width: 78,
    height: 78,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#EFEFEF',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  productCardActive: {
    borderColor: '#79C7E4',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productBadge: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  productBadgeText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadMiniCard: {
    width: 78,
    height: 78,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F7F7F7',
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: '#CFCFCF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadMiniInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlus: {
    fontSize: 27,
    color: '#777777',
    lineHeight: 30,
  },
  uploadMiniText: {
    fontFamily: 'Afacad-Regular',
    fontSize: 11,
    color: '#777777',
    marginTop: 4,
  },
  uploadButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#79C7E4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  typeButtonActive: {
    borderColor: '#79C7E4',
    backgroundColor: '#EAF8FD',
  },
  typeLabel: {
    fontFamily: 'Afacad-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.8,
  },
  typeLabelActive: {
    color: '#2F9FC5',
  },
  typeHelper: {
    fontFamily: 'Afacad-Regular',
    fontSize: 10,
    color: '#888888',
    marginTop: 3,
    textAlign: 'center',
  },
  typeHelperActive: {
    color: '#2F9FC5',
  },
  selectedBox: {
    marginTop: 22,
    minHeight: 84,
    borderRadius: 14,
    backgroundColor: '#F7F7F7',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPreview: {
    width: 60,
    height: 60,
    borderRadius: 9,
    backgroundColor: '#E9E9E9',
  },
  selectedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedTitle: {
    fontFamily: 'Afacad-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  selectedMeta: {
    fontFamily: 'Afacad-Regular',
    fontSize: 12,
    color: '#777777',
    marginTop: 3,
  },
  emptySelectedText: {
    flex: 1,
    fontFamily: 'Afacad-Regular',
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  actionButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#79C7E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    fontFamily: 'Afacad-Bold',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ChooseProductScreen;
