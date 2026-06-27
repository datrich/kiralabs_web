// ========== ADMIN + SUPER ADMIN PAGES ==========
const ADMIN_ROLES = ["admin"];

function adminGuard(container, requiredRole = "admin") {
  const user = getCurrentUser();
  if (!user) {
    return { user, allowed: false, html: loginRequiredHTML("Trang quản trị", "Đăng nhập bằng tài khoản admin để truy cập.") };
  }
  if (requiredRole === "admin" && user.role !== "admin" && !user.isSuperAdmin) {
    return { user, allowed: false, html: `<div class="container"><div class="alert alert-error">Bạn không có quyền truy cập trang này.</div></div>` };
  }
  return { user, allowed: true };
}

Router.register("/admin/shops", {
  render: async (container) => {
    const guard = adminGuard(container, "admin");
    if (!guard.allowed) {
      container.innerHTML = await buildPage(guard.user, guard.html);
      return bindLayoutEvents(container);
    }
    const user = guard.user;
    let shops = [];
    try { shops = await Api.adminShops(); } catch {}
    const pageContent = `
      <div class="container">
        <div class="page-title">Duyệt Shop</div>
        ${shops.length ? `
          <div class="card">
            <table class="table">
              <thead><tr><th>Tên</th><th>Địa chỉ</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                ${shops.map((s) => `
                  <tr>
                    <td><b>${escapeHtml(s.name)}</b><br><span class="text-muted" style="font-size:12px;">${escapeHtml(s.user?.email || "")}</span></td>
                    <td>${escapeHtml(s.address || "")}</td>
                    <td><span class="chip ${s.status === "approved" ? "chip-success" : s.status === "rejected" ? "chip-danger" : "chip-warning"}">${escapeHtml(s.status)}</span></td>
                    <td>
                      ${s.status !== "approved" ? `<button class="btn btn-sm" data-act="approve" data-id="${s.id}">Duyệt</button>` : ""}
                      ${s.status !== "rejected" ? `<button class="btn btn-ghost btn-sm" data-act="reject" data-id="${s.id}">Từ chối</button>` : ""}
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>` : `<div class="empty"><div class="icon">—</div>Chưa có đơn shop</div>`}
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    container.querySelectorAll("[data-act='approve']").forEach((b) => b.addEventListener("click", () => { toast("Đã duyệt (demo)"); Router.handle(); }));
    container.querySelectorAll("[data-act='reject']").forEach((b) => b.addEventListener("click", () => { toast("Đã từ chối (demo)"); Router.handle(); }));
  },
});

Router.register("/admin/products", {
  render: async (container) => {
    const guard = adminGuard(container, "admin");
    if (!guard.allowed) {
      container.innerHTML = await buildPage(guard.user, guard.html);
      return bindLayoutEvents(container);
    }
    const user = guard.user;
    let products = [];
    try { products = await Api.adminProducts(); } catch {}
    const pageContent = `
      <div class="container">
        <div class="page-title">Duyệt sản phẩm</div>
        ${products.length ? `
          <div class="card">
            <table class="table">
              <thead><tr><th>Sản phẩm</th><th>Shop</th><th>Giá</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                ${products.map((p) => `
                  <tr>
                    <td><div style="display:flex;gap:10px;align-items:center;">
                      <img src="${escapeHtml(toAbsoluteUrl(p.image))}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
                      <span>${escapeHtml(p.name)}</span></div></td>
                    <td>${escapeHtml(p.shop?.name || "-")}</td>
                    <td>${escapeHtml(formatPrice(p.price))}</td>
                    <td><span class="chip ${p.isApproved ? "chip-success" : p.isActive ? "chip-warning" : "chip-muted"}">${p.isApproved ? "Đã duyệt" : "Chờ duyệt"}</span></td>
                    <td>
                      ${!p.isApproved ? `<button class="btn btn-sm" data-act="approve" data-id="${p.id}">Duyệt</button>` : ""}
                      ${p.isApproved ? `<button class="btn btn-ghost btn-sm" data-act="reject" data-id="${p.id}">Từ chối</button>` : ""}
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>` : `<div class="empty"><div class="icon">—</div>Chưa có sản phẩm</div>`}
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    container.querySelectorAll("[data-act='approve']").forEach((b) => b.addEventListener("click", () => { toast("Đã duyệt (demo)"); Router.handle(); }));
    container.querySelectorAll("[data-act='reject']").forEach((b) => b.addEventListener("click", () => { toast("Đã từ chối (demo)"); Router.handle(); }));
  },
});

Router.register("/admin/stats", {
  render: async (container) => {
    const guard = adminGuard(container, "admin");
    if (!guard.allowed) {
      container.innerHTML = await buildPage(guard.user, guard.html);
      return bindLayoutEvents(container);
    }
    const user = guard.user;
    let stats = {};
    try { stats = await Api.adminStats(); } catch {}
    const pageContent = `
      <div class="container">
        <div class="page-title">Thống kê</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">Người dùng</div>
            <div class="value">${(stats.users ?? stats.userCount ?? 0).toLocaleString()}</div>
            <div class="trend">↑ +12% tháng này</div>
          </div>
          <div class="stat-card">
            <div class="label">Shop</div>
            <div class="value">${(stats.shops ?? stats.shopCount ?? 0).toLocaleString()}</div>
            <div class="trend">↑ +5% tháng này</div>
          </div>
          <div class="stat-card">
            <div class="label">Sản phẩm</div>
            <div class="value">${(stats.products ?? stats.productCount ?? 0).toLocaleString()}</div>
            <div class="trend">↑ +28% tháng này</div>
          </div>
          <div class="stat-card">
            <div class="label">Lượt try-on</div>
            <div class="value">${(stats.tryons ?? stats.tryonCount ?? 0).toLocaleString()}</div>
            <div class="trend">↑ +45% tháng này</div>
          </div>
        </div>
        <div class="card">
          <h3 style="font-size:16px;margin-bottom:8px;">Chi tiết</h3>
          <pre style="font-size:12px;background:#f6f8fc;padding:12px;border-radius:8px;overflow:auto;max-height:300px;">${escapeHtml(JSON.stringify(stats, null, 2))}</pre>
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
  },
});

Router.register("/superadmin/users", {
  render: async (container) => {
    const guard = adminGuard(container, "admin");
    if (!guard.allowed) {
      container.innerHTML = await buildPage(guard.user, guard.html);
      return bindLayoutEvents(container);
    }
    const user = guard.user;
    if (!user.isSuperAdmin) {
      container.innerHTML = await buildPage(user, `<div class="container"><div class="alert alert-error">Cần quyền Super Admin</div></div>`);
      return bindLayoutEvents(container);
    }
    let users = [];
    try { users = await Api.adminUsers(); } catch {}
    const pageContent = `
      <div class="container">
        <div class="page-title">Quản lý Admin</div>
        <div class="alert alert-info">Cấp/thu quyền admin. Thay đổi có hiệu lực khi user đăng nhập lại.</div>
        ${users.length ? `
          <div class="card">
            <table class="table">
              <thead><tr><th>User</th><th>Role</th><th>Super</th><th></th></tr></thead>
              <tbody>
                ${users.map((u) => `
                  <tr>
                    <td><b>${escapeHtml(u.name || "")}</b><br><span class="text-muted" style="font-size:12px;">${escapeHtml(u.email)}</span></td>
                    <td><span class="chip">${escapeHtml(u.role)}</span></td>
                    <td>${u.isSuperAdmin ? "Có" : "—"}</td>
                    <td>
                      ${u.role !== "admin" ? `<button class="btn btn-sm" data-act="promote" data-id="${u.id}">Cấp admin</button>` : ""}
                      ${u.role === "admin" && !u.isSuperAdmin ? `<button class="btn btn-ghost btn-sm" data-act="demote" data-id="${u.id}">Thu hồi</button>` : ""}
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>` : `<div class="empty">Không có user</div>`}
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    container.querySelectorAll("[data-act='promote']").forEach((b) => b.addEventListener("click", () => { toast("Đã cấp quyền (demo)"); Router.handle(); }));
    container.querySelectorAll("[data-act='demote']").forEach((b) => b.addEventListener("click", () => { toast("Đã thu hồi (demo)"); Router.handle(); }));
  },
});