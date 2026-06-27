// ========== CẤU HÌNH CHUNG ==========
// Đổi API_BASE_URL nếu deploy ở domain khác.
const CONFIG = {
  // Backend Node/Express + Prisma + SQLite (qua Cloudflare Tunnel).
  API_BASE_URL: "https://api.kiralab.io.vn",
  STATIC_BASE: "https://api.kiralab.io.vn",

  TOKEN_KEY: "kira_token",
  USER_KEY: "kira_user",

  BRAND: "KiraLabs",
  PRIMARY_COLOR: "#2B5CE6",

  // ===== DEMO MODE =====
  // Bật = true nếu muốn vào UI không cần backend (tự inject user giả).
  // Tắt = false khi deploy production.
  DEMO_MODE: true,
};

function toAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return CONFIG.STATIC_BASE + url;
  return url;
}

function getToken() { return localStorage.getItem(CONFIG.TOKEN_KEY); }
function getCurrentUser() {
  try { const r = localStorage.getItem(CONFIG.USER_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function setAuth(token, user) {
  localStorage.setItem(CONFIG.TOKEN_KEY, token);
  localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
}

// ========== DEMO HELPERS ==========
// Dùng khi CONFIG.DEMO_MODE = true hoặc khi API trả lỗi.
// Inject user giả để truy cập đầy đủ UI.

const DEMO_USERS = {
  user: {
    id: 1, name: "Demo User", email: "demo@kiralabs.io.vn", phone: "0901234567",
    role: "user", isSuperAdmin: false, isEmailVerified: true, credits: 20,
  },
  shop: {
    id: 2, name: "Demo Shop", email: "shop@kiralabs.io.vn", phone: "0901234568",
    role: "shop", isSuperAdmin: false, isEmailVerified: true, credits: 30,
  },
  admin: {
    id: 3, name: "Demo Admin", email: "admin@kiralabs.io.vn", phone: "0901234569",
    role: "admin", isSuperAdmin: true, isEmailVerified: true, credits: 999,
  },
};

function demoLogin(role = "user") {
  const user = DEMO_USERS[role] || DEMO_USERS.user;
  setAuth("demo_token_" + role, user);
  return { token: "demo_token_" + role, user };
}

// ========== DEMO DATA ==========
const DEMO_DATA = {
  homeContent: {
    banners: [{ image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80" }],
    categories: [
      { id: 1, name: "Nữ", slug: "nu", image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=200" },
      { id: 2, name: "Nam", slug: "nam", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=200" },
      { id: 3, name: "Streetwear", slug: "streetwear", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=200" },
      { id: 4, name: "Công sở", slug: "cong-so", image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=200" },
      { id: 5, name: "Dạ tiệc", slug: "da-tiec", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200" },
      { id: 6, name: "Phụ kiện", slug: "phu-kien", image: "https://images.unsplash.com/photo-1611923134239-b9be5816e23e?w=200" },
    ],
    // Outfit theo dịp — mỗi outfit có nhiều ảnh
    outfits: [
      { id: 1, name: "Đi làm văn phòng", tag: "Công sở",
        images: [
          { id: 101, title: "Set áo blazer thanh lịch", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600", tryOnEnabled: true, clothType: "upper", category: "Đi làm" },
          { id: 102, title: "Quần tây slim fit", image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600", tryOnEnabled: true, clothType: "lower", category: "Đi làm" },
          { id: 103, title: "Sơ mi trắng cổ điển", image: "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600", tryOnEnabled: true, clothType: "upper", category: "Đi làm" },
        ]},
      { id: 2, name: "Đi chơi cuối tuần", tag: "Casual",
        images: [
          { id: 201, title: "Áo thun oversize", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600", tryOnEnabled: true, clothType: "upper", category: "Đi chơi" },
          { id: 202, title: "Quần jeans rách gối", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", tryOnEnabled: true, clothType: "lower", category: "Đi chơi" },
          { id: 203, title: "Sneaker trắng basic", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", tryOnEnabled: false, category: "Đi chơi" },
        ]},
      { id: 3, name: "Dạ tiệc sang trọng", tag: "Dạ tiệc",
        images: [
          { id: 301, title: "Đầm đen hở vai", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600", tryOnEnabled: true, clothType: "overall", category: "Dạ tiệc" },
          { id: 302, title: "Đầm maxi hoa nhí", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600", tryOnEnabled: true, clothType: "overall", category: "Dạ tiệc" },
          { id: 303, title: "Đầm sequin lấp lánh", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600", tryOnEnabled: true, clothType: "overall", category: "Dạ tiệc" },
        ]},
      { id: 4, name: "Du lịch biển", tag: "Du lịch",
        images: [
          { id: 401, title: "Váy maxi tropical", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600", tryOnEnabled: true, clothType: "overall", category: "Du lịch" },
          { id: 402, title: "Set linen nhẹ nhàng", image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600", tryOnEnabled: true, clothType: "overall", category: "Du lịch" },
        ]},
    ],
    // Bộ sưu tập theo mùa / chủ đề
    collections: [
      { id: 1, title: "Bộ sưu tập Xuân 2026", name: "Xuân 2026", tag: "Mùa mới", description: "BST mới nhất với gam màu pastel tươi sáng", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80", count: 48, href: "#/collection/1" },
      { id: 2, title: "Minimalist Wardrobe", name: "Minimalist", tag: "Bền vững", description: "Phong cách tối giản, tinh tế và vượt thời gian", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80", count: 32, href: "#/collection/2" },
      { id: 3, title: "Streetwear Urban", name: "Streetwear", tag: "Xu hướng", description: "Phong cách đường phố cá tính, trẻ trung", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=80", count: 56, href: "#/collection/3" },
      { id: 4, title: "Office Chic", name: "Office Chic", tag: "Công sở", description: "Thanh lịch, chuyên nghiệp cho môi trường văn phòng", image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1600&q=80", count: 28, href: "#/collection/4" },
      { id: 5, title: "Evening Glamour", name: "Evening", tag: "Dạ tiệc", description: "Sang trọng, quyến rũ cho những dịp đặc biệt", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80", count: 24, href: "#/collection/5" },
    ],
    // Gallery tổng hợp (gộp từ outfits)
    gallery: [
      { id: 101, title: "Set áo blazer thanh lịch", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600", tryOnEnabled: true, clothType: "upper", category: "Đi làm" },
      { id: 102, title: "Quần tây slim fit", image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600", tryOnEnabled: true, clothType: "lower", category: "Đi làm" },
      { id: 103, title: "Sơ mi trắng cổ điển", image: "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600", tryOnEnabled: true, clothType: "upper", category: "Đi làm" },
      { id: 201, title: "Áo thun oversize", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600", tryOnEnabled: true, clothType: "upper", category: "Đi chơi" },
      { id: 202, title: "Quần jeans rách gối", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", tryOnEnabled: true, clothType: "lower", category: "Đi chơi" },
      { id: 301, title: "Đầm đen hở vai", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600", tryOnEnabled: true, clothType: "overall", category: "Dạ tiệc" },
      { id: 302, title: "Đầm maxi hoa nhí", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600", tryOnEnabled: true, clothType: "overall", category: "Dạ tiệc" },
      { id: 303, title: "Đầm sequin lấp lánh", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600", tryOnEnabled: true, clothType: "overall", category: "Dạ tiệc" },
      { id: 401, title: "Váy maxi tropical", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600", tryOnEnabled: true, clothType: "overall", category: "Du lịch" },
      { id: 402, title: "Set linen nhẹ nhàng", image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600", tryOnEnabled: true, clothType: "overall", category: "Du lịch" },
      { id: 501, title: "Túi xách da", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600", tryOnEnabled: false, category: "Phụ kiện" },
      { id: 502, title: "Kính mát thời trang", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600", tryOnEnabled: false, category: "Phụ kiện" },
    ],
  },
  categories: [
    { id: 1, name: "Nữ", slug: "nu" },
    { id: 2, name: "Nam", slug: "nam" },
    { id: 3, name: "Streetwear", slug: "streetwear" },
    { id: 4, name: "Công sở", slug: "cong-so" },
    { id: 5, name: "Dạ tiệc", slug: "da-tiec" },
    { id: 6, name: "Phụ kiện", slug: "phu-kien" },
  ],
  products: [
    { id: 101, name: "Set áo blazer thanh lịch", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600", tryOnEnabled: true, clothType: "upper", avgRating: 4.5, reviewCount: 12, shop: { name: "Kira Fashion" }, isApproved: true, category: "Đi làm" },
    { id: 102, name: "Quần tây slim fit", image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600", tryOnEnabled: true, clothType: "lower", avgRating: 4.2, reviewCount: 8, shop: { name: "Kira Fashion" }, isApproved: true, category: "Đi làm" },
    { id: 103, name: "Sơ mi trắng cổ điển", image: "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600", tryOnEnabled: true, clothType: "upper", avgRating: 4.7, reviewCount: 23, shop: { name: "Kira Fashion" }, isApproved: true, category: "Đi làm" },
    { id: 201, name: "Áo thun oversize", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600", tryOnEnabled: true, clothType: "upper", avgRating: 4.9, reviewCount: 45, shop: { name: "Kira Men" }, isApproved: true, category: "Đi chơi" },
    { id: 202, name: "Quần jeans rách gối", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", tryOnEnabled: true, clothType: "lower", avgRating: 4.6, reviewCount: 18, shop: { name: "Kira Men" }, isApproved: true, category: "Đi chơi" },
    { id: 301, name: "Đầm đen hở vai", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600", tryOnEnabled: true, clothType: "overall", avgRating: 4.8, reviewCount: 32, shop: { name: "Kira Lady" }, isApproved: true, category: "Dạ tiệc" },
    { id: 302, name: "Đầm maxi hoa nhí", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600", tryOnEnabled: true, clothType: "overall", avgRating: 4.7, reviewCount: 28, shop: { name: "Kira Lady" }, isApproved: true, category: "Dạ tiệc" },
    { id: 303, name: "Đầm sequin lấp lánh", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600", tryOnEnabled: true, clothType: "overall", avgRating: 4.9, reviewCount: 51, shop: { name: "Kira Lady" }, isApproved: true, category: "Dạ tiệc" },
    { id: 401, name: "Váy maxi tropical", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600", tryOnEnabled: true, clothType: "overall", avgRating: 4.6, reviewCount: 19, shop: { name: "Kira Travel" }, isApproved: true, category: "Du lịch" },
    { id: 402, name: "Set linen nhẹ nhàng", image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600", tryOnEnabled: true, clothType: "overall", avgRating: 4.5, reviewCount: 14, shop: { name: "Kira Travel" }, isApproved: true, category: "Du lịch" },
    { id: 501, name: "Túi xách da", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600", tryOnEnabled: false, avgRating: 4.6, reviewCount: 18, shop: { name: "Kira Accessories" }, isApproved: true, category: "Phụ kiện" },
    { id: 502, name: "Kính mát thời trang", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600", tryOnEnabled: false, avgRating: 4.3, reviewCount: 7, shop: { name: "Kira Accessories" }, isApproved: true, category: "Phụ kiện" },
  ],
  notifications: [
    { id: 1, title: "Chào mừng!", message: "Đây là thông báo demo. Bạn có thể bấm để đánh dấu đã đọc.", read: false, createdAt: new Date().toISOString() },
    { id: 2, title: "BST mới", message: "BST Xuân 2026 đã ra mắt với 48 thiết kế mới.", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, title: "Cảm ơn", message: "Cảm ơn bạn đã tham gia cộng đồng KiraLabs.", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
  shops: [
    { id: 1, name: "Kira Fashion", address: "123 Nguyễn Huệ, Q1, TP.HCM", status: "approved", user: { email: "fashion@kiralabs.io.vn" }, description: "Thời trang nữ hàng hiệu." },
    { id: 2, name: "Kira Men", address: "456 Lê Lợi, Q1, TP.HCM", status: "pending", user: { email: "men@kiralabs.io.vn" }, description: "Thời trang nam công sở." },
  ],
  adminProducts: [
    { id: 601, name: "Áo khoác denim", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600", shop: { name: "Kira Fashion" }, isApproved: false, isActive: true, tryOnEnabled: true },
    { id: 602, name: "Giày sneaker", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", shop: { name: "Kira Men" }, isApproved: false, isActive: true, tryOnEnabled: false },
  ],
  adminUsers: [
    { id: 1, name: "Nguyễn Văn A", email: "a@kiralabs.io.vn", role: "user", isSuperAdmin: false },
    { id: 2, name: "Trần Thị B", email: "b@kiralabs.io.vn", role: "shop", isSuperAdmin: false },
    { id: 3, name: "Lê Văn C", email: "c@kiralabs.io.vn", role: "admin", isSuperAdmin: false },
    { id: 4, name: "Demo Admin", email: "admin@kiralabs.io.vn", role: "admin", isSuperAdmin: true },
  ],
  stats: { users: 1247, shops: 89, products: 456, tryons: 8923 },
  tryonHistory: [
    { id: 1, imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, imageUrl: "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400", createdAt: new Date(Date.now() - 7200000).toISOString() },
  ],
};