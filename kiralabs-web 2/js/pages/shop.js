// ========== SHOP PAGES ==========
Router.register("/shop/apply", {
  render: async (container) => {
    const user = getCurrentUser();
    if (!user) {
      container.innerHTML = await buildPage(null, loginRequiredHTML("Đăng ký Shop", "Đăng nhập để trở thành đối tác bán hàng trên KiraLabs."));
      return bindLayoutEvents(container);
    }
    if (user.role === "shop") {
      container.innerHTML = await buildPage(user,
        `<div class="container"><div class="alert alert-info">Bạn đã là shop. <a href="#/shop/products">Quản lý sản phẩm</a></div></div>`);
      return bindLayoutEvents(container);
    }
    let existing = null;
    try { existing = await Api.shopMe(); } catch {}
    const pageContent = `
      <div class="container">
        <div class="page-title">Đăng ký Shop</div>
        ${existing ? `<div class="alert alert-info">Trạng thái đơn: <b>${escapeHtml(existing.status)}</b></div>` : ""}
        <div class="card">
          <form id="fApply">
            <div class="form-group"><label>Tên shop *</label><input name="name" required placeholder="Shop ABC"></div>
            <div class="form-group"><label>Địa chỉ *</label><input name="address" required placeholder="123 Nguyễn Huệ, Q1, TP.HCM"></div>
            <div class="form-group"><label>Mô tả</label><textarea name="description" placeholder="Shop chuyên thời trang nữ..."></textarea></div>
            <button class="btn btn-block" type="submit" ${existing ? "disabled" : ""}>Gửi đơn đăng ký</button>
          </form>
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    if (existing) return;
    container.querySelector("#fApply").addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await Api.shopApply(Object.fromEntries(new FormData(e.target))); } catch {}
      toast("Đã gửi đơn (demo)");
      setTimeout(() => Router.handle(), 600);
    });
  },
});

Router.register("/shop/products", {
  render: async (container) => {
    const user = getCurrentUser();
    if (!user || (user.role !== "shop" && user.role !== "admin")) {
      container.innerHTML = await buildPage(user, loginRequiredHTML("Quản lý Shop", "Tính năng này dành cho Shop. Đăng nhập bằng tài khoản shop."));
      return bindLayoutEvents(container);
    }
    let products = [];
    try { products = await Api.shopProducts(); } catch {}
    const pageContent = `
      <div class="container">
        <div class="flex-between mb-2">
          <div class="page-title" style="margin:0;">Sản phẩm Shop</div>
          <a class="btn" href="#/shop/add">Đăng sản phẩm</a>
        </div>
        ${products.length
          ? `<div class="product-grid">${products.map(productCardHtml).join("")}</div>`
          : `<div class="empty"><div class="icon">—</div>Chưa có sản phẩm</div>`}
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
  },
});

Router.register("/shop/add", {
  render: async (container) => {
    const user = getCurrentUser();
    if (!user || (user.role !== "shop" && user.role !== "admin")) {
      container.innerHTML = await buildPage(user, loginRequiredHTML("Đăng sản phẩm", "Tính năng này dành cho Shop. Đăng nhập để đăng sản phẩm mới."));
      return bindLayoutEvents(container);
    }
    const categories = await Api.categories().catch(() => []);
    const pageContent = `
      <div class="container">
        <a class="text-muted" href="#/shop/products">← Quay lại</a>
        <div class="page-title mt-1">Đăng sản phẩm mới</div>
        <div class="card">
          <form id="fAdd">
            <div class="form-group"><label>Tên sản phẩm *</label><input name="name" required></div>
            <div class="form-group"><label>Giá (tham khảo)</label><input name="price" type="number" min="0" placeholder="Không bắt buộc"></div>
            <div class="form-group">
              <label>Danh mục *</label>
              <select name="categoryId" required>
                <option value="">-- Chọn --</option>
                ${categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Loại trang phục</label>
              <select name="clothType"><option value="upper">Áo</option><option value="lower">Quần</option><option value="overall">Cả bộ</option></select>
            </div>
            <div class="form-group"><label>Ảnh sản phẩm *</label><input type="file" name="image" accept="image/*" required></div>
            <div class="form-group"><label>Mô tả</label><textarea name="description"></textarea></div>
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:14px;">
              <input type="checkbox" name="tryOnEnabled" checked> Bật thử đồ ảo
            </label>
            <button class="btn btn-block" type="submit">Đăng sản phẩm</button>
          </form>
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    container.querySelector("#fAdd").addEventListener("submit", (e) => {
      e.preventDefault();
      toast("Đã đăng sản phẩm (demo)");
      setTimeout(() => Router.go("/shop/products"), 600);
    });
  },
});