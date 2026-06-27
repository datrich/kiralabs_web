// ========== LAYOUT: HEADER + DRAWER + FOOTER ==========

function renderHeader(user, unreadCount) {
  const isLoggedIn = !!user;
  const drawerHTML = isLoggedIn ? `
    <div class="drawer-mask" data-action="close-drawer"></div>
    <aside class="drawer" id="drawer">
      <div class="drawer-header">
        <div class="avatar">${(user.name || user.email || "U").charAt(0).toUpperCase()}</div>
        <div class="name">${escapeHtml(user.name || "User")}</div>
        <div class="email">${escapeHtml(user.email || "")}</div>
      </div>
      <nav class="drawer-nav">
        <a data-nav="/home" href="#/home">Trang chủ</a>
        <a data-nav="/products" href="#/products">Sản phẩm</a>
        <a data-nav="/foryou" href="#/foryou">For You</a>
        <a data-nav="/tryon" href="#/tryon">Try-on</a>
        <a data-nav="/search" href="#/search">Tìm kiếm</a>
        <a data-nav="/history" href="#/history">Lịch sử</a>
        <a data-nav="/notifications" href="#/notifications">Thông báo</a>
        <a data-nav="/profile" href="#/profile">Hồ sơ</a>
        ${user.role === "user" ? `<a data-nav="/shop/apply" href="#/shop/apply">Đăng ký Shop</a>` : ""}
        ${user.role === "shop" ? `<a data-nav="/shop/products" href="#/shop/products">Sản phẩm Shop</a>` : ""}
        ${user.role === "shop" ? `<a data-nav="/shop/add" href="#/shop/add">Đăng sản phẩm</a>` : ""}
        ${user.role === "admin" || user.isSuperAdmin ? `<a data-nav="/admin/shops" href="#/admin/shops">Duyệt Shop</a>` : ""}
        ${user.role === "admin" || user.isSuperAdmin ? `<a data-nav="/admin/products" href="#/admin/products">Duyệt sản phẩm</a>` : ""}
        ${user.role === "admin" || user.isSuperAdmin ? `<a data-nav="/admin/stats" href="#/admin/stats">Thống kê</a>` : ""}
        ${user.isSuperAdmin ? `<a data-nav="/superadmin/users" href="#/superadmin/users">Quản lý Admin</a>` : ""}
      </nav>
      <div class="drawer-footer">
        <button class="btn btn-ghost btn-block" data-action="logout">Đăng xuất</button>
      </div>
    </aside>
  ` : `
    <div class="drawer-mask" data-action="close-drawer"></div>
    <aside class="drawer" id="drawer">
      <div class="drawer-header">
        <div class="avatar">—</div>
        <div class="name">Khách</div>
        <div class="email">Bạn chưa đăng nhập</div>
      </div>
      <nav class="drawer-nav">
        <a data-nav="/home" href="#/home">Trang chủ</a>
        <a data-nav="/products" href="#/products">Sản phẩm</a>
        <a data-nav="/foryou" href="#/foryou">For You</a>
        <a data-nav="/search" href="#/search">Tìm kiếm</a>
        <a data-nav="/tryon" href="#/tryon">Try-on</a>
      </nav>
      <div class="drawer-footer">
        <a class="btn btn-block" href="#/login">Đăng nhập</a>
        <a class="btn btn-outline btn-block mt-1" href="#/register">Tạo tài khoản</a>
      </div>
    </aside>
  `;

  const rightActions = isLoggedIn ? `
    <a class="credit-pill" href="#/profile" title="Số credit của bạn">${user.credits ?? 0}</a>
    <a class="icon-btn" href="#/notifications" aria-label="Thông báo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      ${unreadCount ? `<span class="badge">${unreadCount > 99 ? "99+" : unreadCount}</span>` : ""}
    </a>
    <a class="icon-btn" href="#/profile" aria-label="Hồ sơ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </a>
    <button class="icon-btn" data-action="logout" aria-label="Đăng xuất">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    </button>
  ` : `
    <a class="btn btn-outline btn-sm" href="#/login">Đăng nhập</a>
    <a class="btn btn-sm" href="#/register">Đăng ký</a>
  `;

  return `
    <header class="header">
      <div class="container header-inner">
        <button class="icon-btn menu-btn" data-action="open-drawer" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <a class="brand" href="#/home">
          <span class="brand-mark">K</span>
          ${escapeHtml(CONFIG.BRAND)}
        </a>
        <nav class="nav">
          <a data-nav="/home" href="#/home">Trang chủ</a>
          <a data-nav="/products" href="#/products">Sản phẩm</a>
          <a data-nav="/foryou" href="#/foryou">For You</a>
          <a data-nav="/tryon" href="#/tryon">Try-on</a>
        </nav>
        <div class="header-actions">${rightActions}</div>
      </div>
    </header>
    ${drawerHTML}
  `;
}

function demoBanner() {
  if (!isDemoToken()) return "";
  return `
    <div class="demo-banner">
      CHẾ ĐỘ DEMO — dữ liệu giả lập, không cần backend. <a href="#" data-action="logout">Thoát demo</a>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="brand"><span class="brand-mark">K</span> KiraLabs</div>
            <p class="about">AI virtual try-on cho thời trang. Trải nghiệm mua sắm thông minh với công nghệ AI tiên tiến.</p>
          </div>
          <div>
            <h4>Sản phẩm</h4>
            <a href="#/products">Tất cả sản phẩm</a>
            <a href="#/foryou">For You</a>
            <a href="#/tryon">Try-on</a>
            <a href="#/history">Lịch sử</a>
          </div>
          <div>
            <h4>Tài khoản</h4>
            <a href="#/profile">Hồ sơ</a>
            <a href="#/notifications">Thông báo</a>
            <a href="#/shop/apply">Đăng ký Shop</a>
            <a href="#/login">Đăng nhập</a>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <a href="#">Trợ giúp</a>
            <a href="#">Điều khoản</a>
            <a href="#">Bảo mật</a>
            <a href="#">Liên hệ</a>
          </div>
        </div>
        <div class="footer-bottom">
          © 2026 KiraLabs
        </div>
      </div>
    </footer>
  `;
}

async function buildPage(user, pageContentHtml, options = {}) {
  const unread = user ? await Api.notifications().then((list) => list.filter((n) => !n.read && !n.isRead).length).catch(() => 0) : 0;
  return `
    <div class="app-shell">
      ${demoBanner()}
      ${renderHeader(user, unread)}
      <div class="page">${pageContentHtml}</div>
      ${options.hideFooter ? "" : renderFooter()}
    </div>
  `;
}

function bindLayoutEvents(root) {
  const r = root || document;
  r.querySelectorAll("[data-action='open-drawer']").forEach((b) =>
    b.addEventListener("click", () => {
      r.querySelector("#drawer")?.classList.add("open");
      r.querySelector(".drawer-mask")?.classList.add("open");
    })
  );
  const closeDrawer = () => {
    r.querySelector("#drawer")?.classList.remove("open");
    r.querySelector(".drawer-mask")?.classList.remove("open");
  };
  r.querySelectorAll("[data-action='close-drawer']").forEach((b) => b.addEventListener("click", closeDrawer));
  r.querySelectorAll("[data-action='logout']").forEach((b) =>
    b.addEventListener("click", () => {
      clearAuth();
      toast("Đã đăng xuất");
      setTimeout(() => Router.go("/home"), 400);
    })
  );

  // Handler chung cho "vào Demo ngay" ở các trang login-required
  r.querySelectorAll("#quickDemoLink, [data-action='quick-demo']").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      demoLogin("user");
      toast("Đã vào Demo");
      Router.handle();
    })
  );
}