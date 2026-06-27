// src/screens/ViewReviewScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, SafeAreaView, ActivityIndicator, Alert, RefreshControl, Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {getReviews, submitReview, Review, ReviewSummary} from '../services/reviewApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ViewReview'>;

const renderStars = (rating: number) =>
  '★★★★★'.split('').map((_, i) => (i < Math.round(rating) ? '★' : '☆')).join('');

const ViewReviewScreen: React.FC<Props> = ({navigation, route}) => {
  const productId = route.params?.productId;

  const [summary, setSummary] = useState<ReviewSummary>({average: 0, count: 0});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!productId) { setLoading(false); return; }
    try {
      const data = await getReviews(productId);
      setSummary(data.summary);
      setReviews(data.reviews);
    } catch (e) {
      // bỏ qua
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, productId]);

  const handleSubmit = async () => {
    if (!productId) return;
    if (myRating < 1) { Alert.alert('Thiếu đánh giá', 'Vui lòng chọn số sao.'); return; }
    setSubmitting(true);
    try {
      const msg = await submitReview(productId, myRating, myComment.trim() || undefined);
      Alert.alert('Thành công', msg);
      setMyComment('');
      await load();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không gửi được đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} activeOpacity={0.75}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VIEW ALL REVIEWS</Text>
        <View style={styles.iconButton} />
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color="#1A1A1A" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>

          {/* Tóm tắt */}
          <View style={styles.summaryBox}>
            <Text style={styles.avgNumber}>{summary.average.toFixed(1)}</Text>
            <Text style={styles.avgStars}>{renderStars(summary.average)}</Text>
            <Text style={styles.avgCount}>{summary.count} đánh giá</Text>
          </View>

          {/* Form viết đánh giá */}
          <View style={styles.writeBox}>
            <Text style={styles.writeTitle}>Viết đánh giá của bạn</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setMyRating(n)} activeOpacity={0.7}>
                  <Text style={[styles.pickStar, n <= myRating && styles.pickStarActive]}>{n <= myRating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Chia sẻ cảm nhận về sản phẩm..."
              placeholderTextColor="#999"
              value={myComment}
              onChangeText={setMyComment}
              multiline
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>GỬI ĐÁNH GIÁ</Text>}
            </TouchableOpacity>
          </View>

          {/* Danh sách đánh giá */}
          <Text style={styles.listTitle}>TẤT CẢ ĐÁNH GIÁ</Text>
          {reviews.length === 0 ? (
            <Text style={styles.empty}>Chưa có đánh giá nào. Hãy là người đầu tiên!</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{r.userName.charAt(0).toUpperCase()}</Text></View>
                  <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.reviewName}>{r.userName}</Text>
                    <Text style={styles.reviewStars}>{renderStars(r.rating)}</Text>
                  </View>
                </View>
                {!!r.comment && <Text style={styles.reviewBody}>{r.comment}</Text>}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    height: Platform.OS === 'android' ? 96 : 82, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  iconButton: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  backIcon: {fontFamily: 'Afacad-Regular', fontSize: 25, color: '#1A1A1A'},
  headerTitle: {fontFamily: 'Afacad-Bold', fontSize: 14, color: '#1A1A1A', letterSpacing: 2},
  scrollContent: {padding: 16, paddingBottom: 40},
  summaryBox: {alignItems: 'center', paddingVertical: 18, backgroundColor: '#F8F9FA', borderRadius: 14},
  avgNumber: {fontFamily: 'Afacad-Bold', fontSize: 40, color: '#1A1A1A'},
  avgStars: {fontSize: 20, color: '#FFB400', marginTop: 2},
  avgCount: {fontFamily: 'Afacad-Regular', fontSize: 13, color: '#777', marginTop: 4},
  writeBox: {marginTop: 18, padding: 16, borderWidth: 1, borderColor: '#EEE', borderRadius: 14},
  writeTitle: {fontFamily: 'Afacad-Bold', fontSize: 15, color: '#1A1A1A'},
  starPicker: {flexDirection: 'row', gap: 6, marginTop: 10},
  pickStar: {fontSize: 30, color: '#DDD'},
  pickStarActive: {color: '#FFB400'},
  commentInput: {backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, marginTop: 12, minHeight: 70, textAlignVertical: 'top', fontFamily: 'Afacad-Regular', fontSize: 14, color: '#1A1A1A'},
  submitBtn: {backgroundColor: '#2B5CE6', paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 12},
  submitText: {color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14, letterSpacing: 0.5},
  listTitle: {fontFamily: 'Afacad-Bold', fontSize: 13, color: '#1A1A1A', letterSpacing: 1, marginTop: 24, marginBottom: 12},
  empty: {textAlign: 'center', color: '#999', fontFamily: 'Afacad-Regular', fontSize: 14, marginTop: 10},
  reviewCard: {paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'},
  reviewTop: {flexDirection: 'row', alignItems: 'center'},
  avatar: {width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center'},
  avatarText: {color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 15},
  reviewName: {fontFamily: 'Afacad-Bold', fontSize: 14, color: '#1A1A1A'},
  reviewStars: {fontSize: 13, color: '#FFB400', marginTop: 2},
  reviewBody: {fontFamily: 'Afacad-Regular', fontSize: 13, color: '#555', lineHeight: 19, marginTop: 8},
});

export default ViewReviewScreen;
