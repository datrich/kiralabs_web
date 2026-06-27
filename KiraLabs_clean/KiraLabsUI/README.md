# Kira Labs - AI Try-On App

App React Native cho phép thử quần áo bằng AI.

## 🛠️ Yêu cầu môi trường

Người nhận cần cài đặt trước:

### 1. Node.js (LTS)
- Tải: https://nodejs.org/
- Cài bản LTS (Long Term Support)
- Verify: `node -v` phải ra `v20.x.x` hoặc cao hơn

### 2. JDK 17
- Tải Eclipse Temurin JDK 17: https://adoptium.net/temurin/releases/?version=17
- Khi cài, **tick "Set JAVA_HOME variable"** và **"Add to PATH"**
- Verify: `java -version` phải ra `openjdk version "17.0.x"`

### 3. Android Studio
- Tải: https://developer.android.com/studio
- Cài đầy đủ: Android SDK + Platform-Tools + Emulator
- Trong SDK Manager, cài thêm:
  - Android API 33 (Tiramisu) hoặc API 34
  - NDK (Side by side) version 27.1.12297006
  - CMake
  - Command-line Tools

### 4. Biến môi trường Windows
- Set `ANDROID_HOME` = đường dẫn Android SDK (vd: `C:\Users\<USER>\AppData\Local\Android\Sdk`)
- Thêm vào Path:
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\emulator`
  - `%JAVA_HOME%\bin`

### 5. Tạo Emulator
- Mở Android Studio → Device Manager → Create Device
- Chọn Pixel 5 hoặc Pixel 7
- System Image: API 33 (Android 13)
- RAM tối thiểu: 4GB

## 🚀 Cài đặt project

```bash
# 1. Clone repo
git clone https://github.com/<your_username>/kiralabs-app.git
cd kiralabs-app

# 2. Cài dependencies (mất 5-10 phút)
npm install

# 3. Tạo file android/local.properties
# Nội dung 1 dòng:
# sdk.dir=C:\\Users\\<YOUR_USER>\\AppData\\Local\\Android\\Sdk
```

## ▶️ Chạy app

1. Bật Android Emulator (qua Android Studio Device Manager)
2. Mở 2 terminal trong thư mục project:

```bash
# Terminal 1: Khởi động Metro Bundler
npm start

# Terminal 2: Build và cài app
npm run android
```

⏱️ Lần đầu build mất 15-30 phút. Lần sau chỉ vài phút.

## 📱 Các màn hình

- **Authentication:** Welcome → Login → SignUp → Forgot Password → Verify → New Password
- **Home:** Categories + Banner
- **Products:** List + Detail + Reviews
- **Try-On:** Select → Choose Body → Choose Product → Result → Video Editor
- **For You:** Recommendations
- **Search:** Recent searches

## 🎨 Tech stack

- React Native 0.85
- React Navigation 7
- TypeScript

## 🔑 Tài khoản test

- Email: bất kỳ (vd `test@gmail.com`)
- Password: 6+ ký tự (vd `123456`)