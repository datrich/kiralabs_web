// src/screens/TryOnSelectScreen.tsx
import React, {useMemo} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import TabBar from '../components/TabBar';
import KiraHeader from '../components/KiraHeader';
import {demoProducts, getProductById} from '../data/demoProducts';

type Props = NativeStackScreenProps<RootStackParamList, 'TryOnSelect'>;

const TryOnSelectScreen: React.FC<Props> = ({navigation, route}) => {
  const selectedProducts = useMemo(() => {
    const productId = route.params?.productId;

    if (productId) {
      return [getProductById(productId)];
    }

    return demoProducts.slice(0, 2);
  }, [route.params?.productId]);

  const hasProducts = selectedProducts.length > 0;

  const handleTabChange = (tab: 'home' | 'tryOn' | 'forYou') => {
    if (tab === 'home') {
      navigation.navigate('Home');
    }

    if (tab === 'forYou') {
      navigation.navigate('ForYou');
    }
  };

  const handleStart = () => {
    navigation.navigate('ChooseBody', {
      productId: selectedProducts[0]?.id,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KiraHeader
        onMenuPress={() => console.log('Menu')}
        onSearchPress={() => navigation.navigate('Search')}
      />

      <TabBar activeTab="tryOn" onTabChange={handleTabChange} />

      {hasProducts ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>READY FOR VIRTUAL TRY-ON</Text>
            <Text style={styles.cardSubtitle}>
              Review your selected product before choosing your body photo.
            </Text>

            <View style={styles.gallery}>
              {selectedProducts.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productThumb}
                  activeOpacity={0.82}
                  onPress={() =>
                    navigation.navigate('ProductDetail', {
                      productId: product.id,
                      category: product.category,
                    })
                  }>
                  <Image source={product.image} style={styles.productImage} />
                  <View style={styles.productBadge}>
                    <Text style={styles.productBadgeText}>
                      {product.clothType.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {[...Array(Math.max(0, 4 - selectedProducts.length))].map(
                (_, index) => (
                  <View key={`empty-${index}`} style={styles.emptyThumb}>
                    <Text style={styles.emptyPlus}>＋</Text>
                  </View>
                ),
              )}
            </View>

            <View style={styles.productTextRow}>
              <View>
                <Text style={styles.filledText}>Choose a product to try-on now!</Text>
                <Text style={styles.itemCount}>{selectedProducts.length} items</Text>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                activeOpacity={0.86}
                onPress={handleStart}>
                <Text style={styles.startButtonText}>START</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>NO PRODUCT WAS CHOSEN</Text>
          <Text style={styles.emptySubtitle}>TRY TO GET SOME PRODUCT YOU WANT</Text>

          <TouchableOpacity
            style={styles.homeButton}
            activeOpacity={0.86}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeButtonText}>GO TO HOME</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardTitle: {
    fontFamily: 'Afacad-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontFamily: 'Afacad-Regular',
    fontSize: 13,
    color: '#777777',
    marginTop: 6,
    lineHeight: 19,
  },
  gallery: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  productThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F1F1',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productBadge: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 7,
    paddingVertical: 3,
    alignItems: 'center',
  },
  productBadgeText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  emptyThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  emptyPlus: {
    fontSize: 24,
    color: '#9A9A9A',
  },
  productTextRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  filledText: {
    fontFamily: 'Afacad-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  itemCount: {
    fontFamily: 'Afacad-Regular',
    fontSize: 12,
    color: '#999999',
    marginTop: 3,
  },
  startButton: {
    width: 116,
    height: 50,
    borderRadius: 9,
    backgroundColor: '#79C7E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontFamily: 'Afacad-Bold',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  emptyContent: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Afacad-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Afacad-Regular',
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 62,
    borderRadius: 8,
    marginTop: 26,
  },
  homeButtonText: {
    fontFamily: 'Afacad-Bold',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default TryOnSelectScreen;
