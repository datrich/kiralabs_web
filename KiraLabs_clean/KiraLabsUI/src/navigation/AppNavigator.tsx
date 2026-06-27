// src/navigation/AppNavigator.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerificationCodeScreen from '../screens/VerificationCodeScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import TryOnSelectScreen from '../screens/TryOnSelectScreen';
import ChooseBodyScreen from '../screens/ChooseBodyScreen';
import ChooseProductScreen from '../screens/ChooseProductScreen';
import TryOnResultScreen from '../screens/TryOnResultScreen';
import TryOnVideoScreen from '../screens/TryOnVideoScreen';
import ProductsPageScreen from '../screens/ProductsPageScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ViewReviewScreen from '../screens/ViewReviewScreen';
import ForYouScreen from '../screens/ForYouScreen';
import SearchScreen from '../screens/SearchScreen';

// Import 3 màn hình mới
import ProfileScreen from '../screens/ProfileScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import HistoryScreen from '../screens/HistoryScreen';

// Màn hình phân quyền (role: user/shop/admin)
import ShopApplyScreen from '../screens/ShopApplyScreen';
import AdminShopsScreen from '../screens/AdminShopsScreen';
import AdminStatsScreen from '../screens/AdminStatsScreen';
import UserAdminScreen from '../screens/UserAdminScreen';
import ShopProductsScreen from '../screens/ShopProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import AdminProductsScreen from '../screens/AdminProductsScreen';
import StoreScreen from '../screens/StoreScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyCode: undefined;
  NewPassword: undefined;
  Home: {initialTab?: 'home' | 'tryOn' | 'forYou'; productId?: number} | undefined;
  TryOnSelect: {productId?: number} | undefined;
  ChooseBody: {productId?: number} | undefined;
  ChooseProduct: {bodyImageUri?: string; productId?: number} | undefined;
  TryOnResult: {resultImageUrl?: string; jobId?: string} | undefined;
  TryOnVideo: {resultImageUrl?: string; jobId?: string} | undefined;
  ProductsPage: {category?: string} | undefined;
  ProductDetail: {productId?: number; category?: string} | undefined;
  ViewReview: {productId: number};
  ForYou: undefined;
  Search: undefined;
  // Đăng ký param cho 3 màn hình mới
  Profile: undefined;
  EmailVerification: { email: string };
  History: undefined;
  // Màn hình phân quyền
  ShopApply: undefined;
  AdminShops: undefined;
  AdminStats: undefined;
  UserAdmin: undefined;
  ShopProducts: undefined;
  AddProduct: undefined;
  AdminProducts: undefined;
  Store: {shopId: number};
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyCode" component={VerificationCodeScreen} />
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TryOnSelect" component={TryOnSelectScreen} />
        <Stack.Screen name="ChooseBody" component={ChooseBodyScreen} />
        <Stack.Screen name="ChooseProduct" component={ChooseProductScreen} />
        <Stack.Screen name="TryOnResult" component={TryOnResultScreen} />
        <Stack.Screen name="TryOnVideo" component={TryOnVideoScreen} />
        <Stack.Screen name="ProductsPage" component={ProductsPageScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="ViewReview" component={ViewReviewScreen} />
        <Stack.Screen name="ForYou" component={ForYouScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        
        {/* Đăng ký component cho 3 màn hình mới */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />

        {/* Màn hình phân quyền */}
        <Stack.Screen name="ShopApply" component={ShopApplyScreen} />
        <Stack.Screen name="AdminShops" component={AdminShopsScreen} />
        <Stack.Screen name="AdminStats" component={AdminStatsScreen} />
        <Stack.Screen name="UserAdmin" component={UserAdminScreen} />
        <Stack.Screen name="ShopProducts" component={ShopProductsScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
        <Stack.Screen name="Store" component={StoreScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;