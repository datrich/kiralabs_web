// src/screens/AddProductScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import KiraHeader from '../components/KiraHeader';
import { getCategories, createCategory, createProduct, Category, ClothType } from '../services/productApi';

const CLOTH_TYPES: { key: ClothType; label: string }[] = [
  { key: 'upper', label: 'UPPER' },
  { key: 'lower', label: 'LOWER' },
  { key: 'overall', label: 'OVERALL' },
];

export default function AddProductScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [clothType, setClothType] = useState<ClothType | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    (async () => {
      try { setCategories(await getCategories()); }
      catch (e: any) { Alert.alert('Lỗi', e?.message || 'Không tải được danh mục'); }
      finally { setLoadingCats(false); }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 });
      if (result.didCancel) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) { Alert.alert('Lỗi', 'Không chọn được ảnh'); return; }
      setImageUri(uri);
    } catch (e: any) { Alert.alert('Lỗi chọn ảnh', e?.message); }
  };

  const handleAddCategory = () => {
    // Luôn dùng ô nhập inline (Alert.prompt chỉ có trên iOS nên không dùng nữa)
    setShowNewCategoryInput(prev => !prev);
  };

  const submitNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const cat = await createCategory(name);
      setCategories(prev => (prev.some(c => c.id === cat.id) ? prev : [...prev, cat]));
      setCategoryId(cat.id);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tạo được danh mục');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Thiếu thông tin', 'Nhập tên sản phẩm.'); return; }
    if (!categoryId) { Alert.alert('Thiếu thông tin', 'Chọn danh mục.'); return; }
    if (!imageUri) { Alert.alert('Thiếu ảnh', 'Chọn ảnh sản phẩm.'); return; }
    setSubmitting(true);
    try {
      await createProduct({
        name: name.trim(),
        categoryId,
        price: price.trim() || undefined,
        clothType: clothType || undefined,
        description: description.trim() || undefined,
        imageUri,
      });
      Alert.alert('Thành công', 'Đã gửi sản phẩm, chờ admin duyệt.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Đăng sản phẩm thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KiraHeader showBack onBackPress={() => navigation.goBack()} title="ĐĂNG SẢN PHẨM" hideRightIcon />
      <ScrollView contentContainerStyle={styles.content}>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlus}>＋</Text>
              <Text style={styles.imageHint}>Chọn ảnh sản phẩm</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Tên sản phẩm *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Áo thun trắng" placeholderTextColor="#999" />

        <Text style={styles.label}>Giá ($)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="VD: 25" placeholderTextColor="#999" />

        <Text style={styles.label}>Danh mục *</Text>
        {loadingCats ? <ActivityIndicator color="#2B5CE6" style={{ marginVertical: 10 }} /> : (
          <View style={styles.chipWrap}>
            {categories.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.chip, categoryId === c.id && styles.chipActive]} onPress={() => setCategoryId(c.id)}>
                <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.chip, styles.chipAdd]} onPress={handleAddCategory}>
              <Text style={styles.chipAddText}>＋ Danh mục mới</Text>
            </TouchableOpacity>
          </View>
        )}

        {showNewCategoryInput && (
          <View style={styles.newCatRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Tên danh mục mới"
              placeholderTextColor="#999"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => submitNewCategory()}
            />
            <TouchableOpacity style={styles.newCatBtn} onPress={() => submitNewCategory()}>
              <Text style={styles.newCatBtnText}>Thêm</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Loại trang phục (cho try-on)</Text>
        <View style={styles.chipWrap}>
          {CLOTH_TYPES.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.chip, clothType === t.key && styles.chipActive]} onPress={() => setClothType(t.key)}>
              <Text style={[styles.chipText, clothType === t.key && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Mô tả</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Mô tả sản phẩm (không bắt buộc)" placeholderTextColor="#999" />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>GỬI SẢN PHẨM</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 20, paddingBottom: 40 },
  imagePicker: { height: 200, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CFCFCF', overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlus: { fontSize: 40, color: '#999' },
  imageHint: { fontFamily: 'Afacad-Regular', fontSize: 13, color: '#999', marginTop: 6 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 18, fontFamily: 'Afacad-Bold' },
  input: { backgroundColor: '#F5F5F5', padding: 14, borderRadius: 8, color: '#1A1A1A', fontFamily: 'Afacad-Regular', fontSize: 15 },
  textArea: { height: 90, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F2F2F2', borderWidth: 1, borderColor: '#E5E5E5' },
  chipActive: { backgroundColor: '#2B5CE6', borderColor: '#2B5CE6' },
  chipAdd: { backgroundColor: '#FFF', borderColor: '#2B5CE6', borderStyle: 'dashed' },
  chipAddText: { fontFamily: 'Afacad-Bold', fontSize: 12, color: '#2B5CE6' },
  newCatRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  newCatBtn: { backgroundColor: '#2B5CE6', paddingHorizontal: 18, paddingVertical: 13, borderRadius: 8 },
  newCatBtnText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 14 },
  chipText: { fontFamily: 'Afacad-Bold', fontSize: 12, color: '#666' },
  chipTextActive: { color: '#FFF' },
  submitBtn: { backgroundColor: '#2B5CE6', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  submitText: { color: '#FFF', fontFamily: 'Afacad-Bold', fontSize: 15, letterSpacing: 0.5 },
});
