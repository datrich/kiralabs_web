// ========== USER PAGES ==========
Router.register("/history", {
  render: async (container) => {
    const user = getCurrentUser();
    if (!user) {
      container.innerHTML = await buildPage(null, loginRequiredHTML("Xem lịch sử try-on", "Đăng nhập để lưu và xem lại các lần thử đồ của bạn."));
      return bindLayoutEvents(container);
    }
    let items = [];
    try { items = await Api.tryonHistory(); }
    catch {
      const me = await Api.me().catch(() => null);
      items = me?.tryonHistory || me?.tryonHistories || [];
    }
    const pageContent = `
      <div class="container">
        <div class="page-title">Lịch sử try-on</div>
        <p class="text-muted mb-2">Lưu trong 24h.</p>
        ${items.length
          ? `<div class="history-grid">
              ${items.map((it) => `
                <div class="history-item">
                  <img src="${escapeHtml(toAbsoluteUrl(it.imageUrl || it.image || it.result_image_url))}" alt="">
                  <div class="date">${escapeHtml(timeAgo(it.createdAt))}</div>
                </div>
              `).join("")}
            </div>`
          : `<div class="empty"><div class="icon">—</div>Chưa có lịch sử</div>`}
        <div class="text-center mt-3">
          <a class="btn" href="#/tryon">Thử ngay</a>
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
  },
});

Router.register("/profile", {
  render: async (container) => {
    const user = getCurrentUser();
    if (!user) {
      container.innerHTML = await buildPage(null, loginRequiredHTML("Hồ sơ của bạn", "Đăng nhập để xem và chỉnh sửa thông tin tài khoản."));
      return bindLayoutEvents(container);
    }
    let me = user;
    try { me = await Api.me(); setAuth(getToken(), me); } catch {}
    const pageContent = `
      <div class="container">
        <div class="page-title">Hồ sơ</div>
        <div class="card mb-2">
          <h3 style="font-size:16px;margin-bottom:8px;">Thông tin</h3>
          <div class="form-group"><label>Họ tên</label><input id="fName" value="${escapeHtml(me.name || "")}"></div>
          <div class="form-group"><label>Email</label><input value="${escapeHtml(me.email || "")}" disabled></div>
          <div class="form-group"><label>Số điện thoại</label><input id="fPhone" value="${escapeHtml(me.phone || "")}"></div>
          <button class="btn" id="btnSave">Lưu</button>
        </div>
        <div class="card mb-2">
          <h3 style="font-size:16px;margin-bottom:8px;">Tài khoản</h3>
          <div class="flex-between mb-1"><span>Vai trò</span><span class="chip">${me.role}${me.isSuperAdmin ? " (Super)" : ""}</span></div>
          <div class="flex-between mb-1"><span>Credit</span><span><b>${me.credits ?? 0}</b></span></div>
          <div class="flex-between mb-1"><span>Email xác minh</span><span class="chip ${me.isEmailVerified ? "chip-success" : "chip-warning"}">${me.isEmailVerified ? "Đã xác minh" : "Chưa xác minh"}</span></div>
          ${!me.isEmailVerified ? `<a class="btn btn-outline btn-sm mt-1" href="#/verify-email">Xác minh email</a>` : ""}
        </div>
        <div class="card">
          <button class="btn btn-danger btn-block" data-action="logout">Đăng xuất</button>
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    container.querySelector("#btnSave").addEventListener("click", () => {
      const u = { ...me, name: container.querySelector("#fName").value, phone: container.querySelector("#fPhone").value };
      setAuth(getToken(), u);
      toast("Đã lưu");
    });
  },
});

Router.register("/notifications", {
  render: async (container) => {
    const user = getCurrentUser();
    if (!user) {
      container.innerHTML = await buildPage(null, loginRequiredHTML("Thông báo của bạn", "Đăng nhập để xem các thông báo về shop, sản phẩm và tài khoản."));
      return bindLayoutEvents(container);
    }
    let list = [];
    try { list = await Api.notifications(); } catch {}
    const pageContent = `
      <div class="container">
        <div class="flex-between mb-2">
          <div class="page-title" style="margin:0;">Thông báo</div>
          <button class="btn btn-ghost btn-sm" id="btnReadAll">Đánh dấu đã đọc</button>
        </div>
        <div id="notifList">
          ${list.length
            ? list.map(notifHtml).join("")
            : `<div class="empty"><div class="icon">—</div>Không có thông báo</div>`}
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    container.querySelector("#btnReadAll").addEventListener("click", () => {
      toast("Đã đánh dấu");
      Router.handle();
    });
    container.querySelectorAll("#notifList .notif-item").forEach((el) => {
      el.addEventListener("click", () => el.classList.remove("unread"));
    });
  },
});

function notifHtml(n) {
  const unread = !(n.read || n.isRead);
  return `
    <div class="notif-item ${unread ? "unread" : ""}" data-id="${n.id}">
      <div style="flex:1;">
        <div class="title">${escapeHtml(n.title || n.type || "Thông báo")}</div>
        <div class="msg">${escapeHtml(n.message || n.body || "")}</div>
        <div class="time">${escapeHtml(timeAgo(n.createdAt))}</div>
      </div>
    </div>
  `;
}

Router.register("/search", {
  render: async (container) => {
    const user = getCurrentUser();
    const categories = await Api.categories().catch(() => []);
    const pageContent = `
      <div class="container">
        <div class="page-title">Tìm kiếm</div>
        <div class="card mb-2">
          <input id="q" placeholder="Tìm sản phẩm..." style="width:100%;padding:12px;border:1px solid var(--border);border-radius:10px;font-size:16px;">
        </div>
        <div class="section-title">Hoặc theo danh mục</div>
        <div class="category-scroll">
          ${categories.map((c) => `
            <a class="category-card" href="#/products?categorySlug=${encodeURIComponent(c.slug || c.name)}">
              <div class="img-wrap"><img src="${escapeHtml(toAbsoluteUrl(c.image || c.imageUrl))}"></div>
              <div class="name">${escapeHtml(c.name)}</div>
            </a>
          `).join("")}
        </div>
        <div id="results" class="product-grid mt-2"></div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    let timer;
    container.querySelector("#q").addEventListener("input", (e) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = e.target.value.trim();
        if (!q) { container.querySelector("#results").innerHTML = ""; return; }
        try {
          const list = await Api.products({ q });
          container.querySelector("#results").innerHTML = list.length
            ? list.map(productCardHtml).join("")
            : `<div class="empty" style="grid-column:1/-1;">Không tìm thấy</div>`;
        } catch {}
      }, 400);
    });
  },
});

Router.register("/foryou", {
  render: async (container) => {
    const user = getCurrentUser();
    let list = [];
    try { list = await Api.products({}); } catch {}
    list = (list || []).filter((p) => p.tryOnEnabled).slice(0, 12);
    const pageContent = `
      <div class="container">
        <div class="page-title">Dành cho bạn</div>
        <p class="text-muted mb-2">Các sản phẩm có thử đồ ảo nổi bật.</p>
        ${list.length
          ? `<div class="product-grid">${list.map(productCardHtml).join("")}</div>`
          : `<div class="empty"><div class="icon">—</div>Chưa có gợi ý</div>`}
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
  },
});