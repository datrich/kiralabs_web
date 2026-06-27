// ========== PRODUCTS LIST + DETAIL + SHOP PUBLIC ==========
Router.register("/products", {
  render: async (container) => {
    const user = getCurrentUser();
    const queryStr = window.location.hash.includes("?") ? window.location.hash.split("?")[1] : "";
    const qs = new URLSearchParams(queryStr);
    const filter = {
      categorySlug: qs.get("categorySlug") || undefined,
      shopId: qs.get("shopId") || undefined,
      tryOn: qs.get("tryOn") || undefined,
      q: qs.get("q") || undefined,
    };
    Object.keys(filter).forEach((k) => filter[k] === undefined && delete filter[k]);

    const [products, categories] = await Promise.all([
      Api.products(filter).catch(() => []),
      Api.categories().catch(() => []),
    ]);

    const pageContent = `
      <div class="container">
        <div class="page-title">Sản phẩm</div>
        <div class="card mb-2" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <input id="searchInput" placeholder="Tìm theo tên..." value="${escapeHtml(qs.get("q") || "")}" style="flex:1;min-width:200px;padding:10px;border:1px solid var(--border);border-radius:10px;">
          <select id="catFilter" style="padding:10px;border:1px solid var(--border);border-radius:10px;">
            <option value="">Tất cả danh mục</option>
            ${categories.map((c) => `<option value="${escapeHtml(c.slug || c.name)}" ${filter.categorySlug === (c.slug || c.name) ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}
          </select>
          <label style="display:flex;align-items:center;gap:6px;font-size:14px;">
            <input type="checkbox" id="tryonFilter" ${filter.tryOn === "1" ? "checked" : ""}> Có try-on
          </label>
        </div>
        <div id="grid" class="product-grid">
          ${products.length ? products.map(productCardHtml).join("") : `<div class="empty" style="grid-column:1/-1;"><div class="icon">—</div>Không có sản phẩm</div>`}
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);

    const applyFilters = () => {
      const p = new URLSearchParams();
      const cat = container.querySelector("#catFilter").value;
      const tryon = container.querySelector("#tryonFilter").checked;
      const q = container.querySelector("#searchInput").value.trim();
      if (cat) p.set("categorySlug", cat);
      if (tryon) p.set("tryOn", "1");
      if (q) p.set("q", q);
      Router.go("/products" + (p.toString() ? "?" + p.toString() : ""));
    };
    container.querySelector("#catFilter").addEventListener("change", applyFilters);
    container.querySelector("#tryonFilter").addEventListener("change", applyFilters);
    let timer;
    container.querySelector("#searchInput").addEventListener("input", () => {
      clearTimeout(timer); timer = setTimeout(applyFilters, 400);
    });
  },
});

Router.register("/products/:id", {
  render: async (container, params) => {
    const user = getCurrentUser();
    const id = params.id;
    const [product, reviews] = await Promise.all([
      Api.product(id).catch((e) => ({ __error: e.message })),
      Api.productReviews(id).catch(() => []),
    ]);
    if (product.__error) {
      container.innerHTML = await buildPage(user, `<div class="container"><div class="alert alert-error">${escapeHtml(product.__error)}</div></div>`);
      return bindLayoutEvents(container);
    }
    const img = toAbsoluteUrl(product.image || product.imageUrl);
    const colors = product.colors || ["Đen", "Trắng", "Be"];
    const sizes = product.sizes || ["S", "M", "L", "XL"];

    const pageContent = `
      <div class="container">
        <a href="#/products" class="text-muted">← Quay lại</a>
        <div class="product-detail mt-2">
          <div class="img-main"><img src="${escapeHtml(img)}" alt=""></div>
          <div>
            <h1>${escapeHtml(product.name || "")}</h1>
            <div class="text-muted">${escapeHtml(product.shop?.name || product.shopName || "")}</div>
            <div class="price">${escapeHtml(formatPrice(product.price))}</div>
            <div class="flex gap-1 mb-2">
              ${product.tryOnEnabled ? `<span class="chip chip-success">Try-on</span>` : ""}
              ${product.isApproved ? "" : `<span class="chip chip-warning">Chờ duyệt</span>`}
              <span class="chip">⭐ ${product.avgRating ?? 0} (${product.reviewCount ?? reviews.length})</span>
            </div>
            <p class="text-muted mb-2">${escapeHtml(product.description || "Mô tả sản phẩm demo. Đây là dữ liệu mẫu để bạn xem UI.")}</p>
            <div class="option-group">
              <div class="label">Màu sắc</div>
              <div class="options" id="colorOpts">
                ${colors.map((c, i) => `<button class="option ${i === 0 ? "active" : ""}" data-c="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}
              </div>
            </div>
            <div class="option-group">
              <div class="label">Kích cỡ</div>
              <div class="options" id="sizeOpts">
                ${sizes.map((s, i) => `<button class="option ${i === 0 ? "active" : ""}" data-s="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
              </div>
            </div>
            <div class="product-actions">
              <button class="btn" id="btnTryon">Try-on ngay</button>
              ${product.shopId ? `<a class="btn btn-outline" href="#/shops/${product.shopId}">Tới shop</a>` : ""}
            </div>
          </div>
        </div>
        <div class="mt-3">
          <h2 style="font-size:18px;margin-bottom:12px;">Đánh giá (${reviews.length})</h2>
          <div id="reviewFormSlot"></div>
          <div id="reviewList">
            ${reviews.length
              ? reviews.map(reviewHtml).join("")
              : `<div class="empty"><div class="icon">—</div>Chưa có đánh giá</div>`}
          </div>
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);

    const colorOpts = container.querySelectorAll("#colorOpts .option");
    colorOpts.forEach((b) => b.addEventListener("click", () => {
      colorOpts.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
    }));
    const sizeOpts = container.querySelectorAll("#sizeOpts .option");
    sizeOpts.forEach((b) => b.addEventListener("click", () => {
      sizeOpts.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
    }));
    container.querySelector("#btnTryon").addEventListener("click", () => {
      sessionStorage.setItem("kira_tryon_product", JSON.stringify(product));
      Router.go("/tryon/body");
    });

    const formSlot = container.querySelector("#reviewFormSlot");
    if (user && user.role !== "shop") {
      let rating = 0;
      const form = document.createElement("form");
      form.className = "card mb-2";
      form.innerHTML = `
        <h3 style="font-size:16px;margin-bottom:8px;">Viết đánh giá của bạn</h3>
        <div id="starSlot" style="margin-bottom:10px;"></div>
        <textarea name="comment" placeholder="Cảm nhận của bạn..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:10px;min-height:80px;"></textarea>
        <button class="btn mt-1" type="submit">Gửi đánh giá</button>
      `;
      formSlot.appendChild(form);
      const starSlot = form.querySelector("#starSlot");
      starSlot.appendChild(pickStarWidget(0, (v) => (rating = v)));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!rating) return toast("Chọn số sao");
        toast("Đã gửi đánh giá (demo)");
        form.reset();
      });
    }
  },
});

function reviewHtml(r) {
  return `
    <div class="review">
      <div class="head">
        <span class="author">${escapeHtml(r.user?.name || r.userName || "User")}</span>
        <span class="date">${escapeHtml(timeAgo(r.createdAt))}</span>
      </div>
      <div class="stars">${renderStars(r.rating)}</div>
      <div class="comment">${escapeHtml(r.comment || "")}</div>
    </div>
  `;
}

Router.register("/shops/:id", {
  render: async (container, params) => {
    const user = getCurrentUser();
    const id = params.id;
    let shop;
    try { shop = await Api.shopPublic(id); } catch { shop = null; }
    if (!shop) {
      container.innerHTML = await buildPage(user, `<div class="container"><div class="alert alert-error">Không tìm thấy shop</div></div>`);
      return bindLayoutEvents(container);
    }
    const products = await Api.products({ shopId: id }).catch(() => []);
    const mapsUrl = shop.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}` : null;

    const pageContent = `
      <div class="container">
        <a href="#/products?shopId=${id}" class="text-muted">← Quay lại</a>
        <div class="card mt-2">
          <h1 style="font-size:22px;margin-bottom:4px;">${escapeHtml(shop.name || "")}</h1>
          <div class="text-muted">${escapeHtml(shop.address || "Chưa có địa chỉ")}</div>
          ${shop.description ? `<p class="mt-2">${escapeHtml(shop.description)}</p>` : ""}
          <div class="mt-2">
            ${mapsUrl ? `<a class="btn btn-outline btn-sm" href="${mapsUrl}" target="_blank">Mở Google Maps</a>` : ""}
            <a class="btn btn-sm" href="#/products?shopId=${id}">Sản phẩm của shop</a>
          </div>
        </div>
        <div class="section-title">Sản phẩm</div>
        <div class="product-grid">
          ${products.length ? products.map(productCardHtml).join("") : `<div class="empty" style="grid-column:1/-1;">Chưa có sản phẩm</div>`}
        </div>
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
  },
});