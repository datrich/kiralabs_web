// ========== API CLIENT với DEMO FALLBACK ==========
// Khi backend trả lỗi (CORS, network, 500...) → tự fallback sang DEMO_DATA
// để người dùng vẫn xem được UI đầy đủ.

async function tryRealCall(fn, demoFallback) {
  if (isDemoToken()) return demoFallback; // luôn dùng demo nếu đã login demo
  try {
    const result = await fn();
    return result;
  } catch (e) {
    console.warn("[API fallback to DEMO]", e.message);
    return demoFallback;
  }
}

const Api = {
  async request(path, { method = "GET", body = null, isForm = false, auth = true } = {}) {
    if (isDemoToken()) {
      throw new Error("Demo mode");
    }
    const headers = {};
    if (!isForm) headers["Content-Type"] = "application/json";
    if (auth) { const t = getToken(); if (t) headers["Authorization"] = `Bearer ${t}`; }

    const res = await fetch(CONFIG.API_BASE_URL + path, {
      method, headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) {
      const err = new Error((data && (data.message || data.error)) || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  },

  async list(path, opts) {
    if (isDemoToken()) throw new Error("Demo mode");
    const r = await this.request(path, opts);
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.data)) return r.data;
    if (r && Array.isArray(r.items)) return r.items;
    return [];
  },

  // ========== AUTH ==========
  register: (payload) => Api.request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: async (email, password) => {
    if (CONFIG.DEMO_MODE) {
      // Trong demo, login bất kỳ email nào cũng OK — map "admin@" → admin
      let role = "user";
      if (email.includes("admin")) role = "admin";
      else if (email.includes("shop")) role = "shop";
      const r = demoLogin(role);
      return r;
    }
    const r = await Api.request("/auth/login", { method: "POST", body: { email, password }, auth: false });
    if (r && r.token) {
      let user = r.user;
      if (!user) { try { user = await Api.request("/users/me"); } catch {} }
      if (user) setAuth(r.token, user);
      return { token: r.token, user };
    }
    return r;
  },
  forgotPassword: (email) => Api.request("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  verifyResetCode: (email, code) => Api.request("/auth/verify-reset-code", { method: "POST", body: { email, code }, auth: false }),
  resetPassword: (email, code, newPassword) => Api.request("/auth/reset-password", { method: "POST", body: { email, code, newPassword }, auth: false }),
  verifyEmailCode: (code) => Api.request("/users/me/verify-code", { method: "POST", body: { code } }),

  // ========== USER ==========
  me: async () => {
    const u = getCurrentUser();
    if (u) return u;
    return tryRealCall(() => Api.request("/users/me"), DEMO_USERS.user);
  },

  // ========== HOME / CATEGORIES / PRODUCTS ==========
  homeContent: async () => tryRealCall(() => Api.request("/home-content"), DEMO_DATA.homeContent),
  categories: async () => tryRealCall(() => Api.list("/api/categories"), DEMO_DATA.categories),
  products: async (params = {}) => {
    return tryRealCall(() => {
      const qs = new URLSearchParams(params).toString();
      return Api.list("/api/products" + (qs ? "?" + qs : ""));
    }, DEMO_DATA.products);
  },
  product: async (id) => {
    return tryRealCall(() => Api.request(`/api/products/${id}`),
      DEMO_DATA.products.find((p) => String(p.id) === String(id)) || DEMO_DATA.products[0]);
  },
  productReviews: async (id) => tryRealCall(() => Api.list(`/api/products/${id}/reviews`), [
    { id: 1, rating: 5, comment: "Sản phẩm rất đẹp, chất lượng tốt!", user: { name: "Nguyễn A" }, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 2, rating: 4, comment: "Giao hàng nhanh, đóng gói cẩn thận.", user: { name: "Trần B" }, createdAt: new Date(Date.now() - 172800000).toISOString() },
  ]),
  addReview: (id, payload) => Api.request(`/api/products/${id}/reviews`, { method: "POST", body: payload }),

  // ========== NOTIFICATIONS ==========
  notifications: async () => tryRealCall(() => Api.list("/notifications"), DEMO_DATA.notifications),
  readAllNotifications: () => Api.request("/notifications/read-all", { method: "POST", body: {} }),
  readNotification: (id) => Api.request(`/notifications/${id}/read`, { method: "POST", body: {} }),

  // ========== TRY-ON ==========
  tryon: async (formData) => {
    if (isDemoToken()) {
      // Trả về ảnh demo (chính là ảnh người mặc giả lập)
      await new Promise((r) => setTimeout(r, 1200));
      return {
        success: true,
        data: {
          result_image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
          mobile_result_image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
        },
      };
    }
    return Api.request("/tryon", { method: "POST", body: formData, isForm: true });
  },
  tryonHistory: async () => tryRealCall(() => Api.list("/tryon/history"), DEMO_DATA.tryonHistory),

  // ========== VIDEO ==========
  videoGenerate: async (payload) => {
    if (isDemoToken()) {
      await new Promise((r) => setTimeout(r, 600));
      return { taskId: "demo_video_task_" + Date.now() };
    }
    return Api.request("/api/video/generate", { method: "POST", body: payload });
  },
  videoStatus: async (taskId) => {
    if (isDemoToken() || taskId.startsWith("demo_")) {
      return {
        status: "success",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      };
    }
    return Api.request(`/api/video/status/${taskId}`);
  },

  // ========== SHOP ==========
  shopApply: (payload) => Api.request("/shop/apply", { method: "POST", body: payload }),
  shopMe: async () => tryRealCall(() => Api.request("/shop/me"), { status: "approved", name: "Demo Shop" }),
  shopPublic: async (id) => tryRealCall(() => Api.request(`/api/shops/${id}`), DEMO_DATA.shops.find((s) => s.id == id) || DEMO_DATA.shops[0]),
  shopProducts: async () => tryRealCall(() => Api.list("/api/shop/products"), DEMO_DATA.products),
  addProduct: (formData) => Api.request("/api/products", { method: "POST", body: formData, isForm: true }),
  deleteProduct: (id) => Api.request(`/api/products/${id}`, { method: "DELETE" }),

  // ========== ADMIN ==========
  adminShops: async () => tryRealCall(() => Api.list("/admin/shops"), DEMO_DATA.shops),
  approveShop: (id) => Api.request(`/admin/shops/${id}/approve`, { method: "POST", body: {} }),
  rejectShop: (id) => Api.request(`/admin/shops/${id}/reject`, { method: "POST", body: {} }),
  adminProducts: async () => tryRealCall(() => Api.list("/admin/products"), DEMO_DATA.adminProducts),
  approveProduct: (id) => Api.request(`/admin/products/${id}/approve`, { method: "POST", body: {} }),
  rejectProduct: (id) => Api.request(`/admin/products/${id}/reject`, { method: "POST", body: {} }),
  adminStats: async () => tryRealCall(() => Api.request("/admin/stats"), DEMO_DATA.stats),
  adminUsers: async () => tryRealCall(() => Api.list("/admin/users"), DEMO_DATA.adminUsers),

  // ========== SUPER ADMIN ==========
  promoteAdmin: (id) => Api.request(`/superadmin/users/${id}/promote-admin`, { method: "POST", body: {} }),
  demoteAdmin: (id) => Api.request(`/superadmin/users/${id}/demote-admin`, { method: "POST", body: {} }),
};