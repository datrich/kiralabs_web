// ========== HOME PAGE (Slide layout) ==========
async function loadNotificationsUnread() {
  try {
    const list = await Api.notifications();
    return list.filter((n) => !n.read && !n.isRead).length;
  } catch { return 0; }
}

Router.register("/home", {
  render: async (container) => {
    const user = getCurrentUser();

    // Lấy dữ liệu từ backend, fallback sang demo data
    let homeData;
    try { homeData = await Api.homeContent(); } catch { homeData = {}; }
    const outfits = homeData.outfits || (typeof DEMO_DATA !== "undefined" ? DEMO_DATA.outfits : []);
    const collections = homeData.collections || (typeof DEMO_DATA !== "undefined" ? DEMO_DATA.collections : []);
    const gallery = homeData.gallery || homeData.products || (typeof DEMO_DATA !== "undefined" ? DEMO_DATA.gallery : []);

    // Hero slides từ collections (lấy top 5) hoặc mặc định
    const heroSlides = (collections && collections.length)
      ? collections.slice(0, 5).map((c) => ({
          tag: c.tag || "Bộ sưu tập",
          title: c.title || c.name,
          sub: c.description || "",
          image: toAbsoluteUrl(c.image || c.imageUrl),
          href: `#/collection/${c.id}`,
        }))
      : [
          { tag: "Mùa mới", title: "Khám phá phong cách của bạn", sub: "Hàng trăm mẫu thiết kế đang chờ bạn", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80", href: "#/products" },
        ];

    const pageContent = `
      <div class="container">
        ${user && !user.isEmailVerified ? `<div class="alert alert-warning">Email chưa xác minh. <a href="#/verify-email">Xác minh ngay</a></div>` : ""}

        ${renderHeroSlide(heroSlides)}

        ${renderCatPills(homeData.categories || [])}

        ${renderCarousel({
          title: "Gợi ý cho bạn",
          sub: "Những thiết kế nổi bật dành riêng cho bạn",
          items: (gallery || []).filter((p) => p.tryOnEnabled).slice(0, 12),
          size: "md",
          showTryOn: true,
        })}

        ${renderCarousel({
          title: "Xu hướng mới nhất",
          sub: "Cập nhật những phong cách hot nhất tuần này",
          items: gallery || [],
          size: "md",
          showTryOn: true,
        })}

        ${renderOutfitCarousel({
          title: "Outfit theo dịp",
          sub: "Đi làm · Đi chơi · Dạ tiệc · Du lịch",
          items: outfits || [],
        })}

        ${renderCollectionGrid(collections || [])}

        ${renderCompactCompare()}
      </div>
    `;
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);
    initHeroSlide();
    initCarousels();
  },
});

// ========== HERO SLIDE (auto-rotate) ==========
function renderHeroSlide(slides) {
  if (!slides || !slides.length) return "";
  return `
    <div class="hero-slide" id="heroSlide">
      ${slides.map((s, i) => `
        <div class="slide ${i === 0 ? "active" : ""}" data-i="${i}">
          <img class="slide-bg" src="${escapeHtml(s.image)}" alt="">
          <div class="slide-overlay"></div>
          <div class="slide-content">
            <span class="slide-tag">${escapeHtml(s.tag || "")}</span>
            <div class="slide-title">${escapeHtml(s.title)}</div>
            <div class="slide-sub">${escapeHtml(s.sub)}</div>
            ${s.href ? `<a class="btn" href="${escapeHtml(s.href)}" style="background:var(--white);color:var(--black);border-color:var(--white);">Khám phá →</a>` : ""}
          </div>
        </div>
      `).join("")}
      <button class="arrow prev" data-hero="prev" aria-label="Trước">‹</button>
      <button class="arrow next" data-hero="next" aria-label="Sau">›</button>
      <div class="slide-dots">
        ${slides.map((_, i) => `<div class="dot ${i === 0 ? "active" : ""}" data-dot="${i}"></div>`).join("")}
      </div>
    </div>
  `;
}

function initHeroSlide() {
  const hero = document.getElementById("heroSlide");
  if (!hero) return;
  const slides = hero.querySelectorAll(".slide");
  const dots = hero.querySelectorAll(".dot");
  let current = 0;
  let timer = null;

  const goTo = (i) => {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    current = i;
  };
  const next = () => goTo((current + 1) % slides.length);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);

  hero.querySelector("[data-hero='next']").addEventListener("click", () => { next(); reset(); });
  hero.querySelector("[data-hero='prev']").addEventListener("click", () => { prev(); reset(); });
  dots.forEach((d) => d.addEventListener("click", () => { goTo(Number(d.dataset.dot)); reset(); }));

  const reset = () => { if (timer) clearInterval(timer); timer = setInterval(next, 5000); };
  reset();
}

// ========== CATEGORY PILLS ==========
function renderCatPills(categories) {
  if (!categories || !categories.length) return "";
  return `
    <div class="cat-pills">
      <a class="cat-pill active" href="#/home">Tất cả</a>
      ${categories.map((c) => `
        <a class="cat-pill" href="#/collection/${c.id}">${escapeHtml(c.name)}</a>
      `).join("")}
    </div>
  `;
}

// ========== CAROUSEL (dải ngang) ==========
function renderCarousel({ title, sub, items, size = "md", showTryOn = false }) {
  if (!items || !items.length) return "";
  const id = "carousel-" + title.replace(/\s+/g, "-").toLowerCase();
  return `
    <section class="carousel" id="${id}">
      <div class="carousel-header">
        <div>
          <div class="carousel-title">${title}</div>
          ${sub ? `<div class="carousel-sub">${escapeHtml(sub)}</div>` : ""}
        </div>
        <div class="carousel-controls">
          <button class="carousel-btn" data-carousel="${id}" data-dir="prev" aria-label="Trước">‹</button>
          <button class="carousel-btn" data-carousel="${id}" data-dir="next" aria-label="Sau">›</button>
        </div>
      </div>
      <div class="carousel-track" data-track="${id}">
        ${items.map((item) => imageCardHtml(item, size, showTryOn)).join("")}
      </div>
    </section>
  `;
}

function initCarousels() {
  document.querySelectorAll(".carousel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.carousel;
      const dir = btn.dataset.dir === "next" ? 1 : -1;
      const track = document.querySelector(`[data-track='${id}']`);
      if (!track) return;
      const card = track.querySelector(".img-card");
      const step = card ? card.offsetWidth + 16 : 280;
      track.scrollBy({ left: step * dir * 2, behavior: "smooth" });
    });
  });
  // Update button state khi cuộn
  document.querySelectorAll(".carousel").forEach((c) => {
    const track = c.querySelector(".carousel-track");
    const prev = c.querySelector("[data-dir='prev']");
    const next = c.querySelector("[data-dir='next']");
    if (!track) return;
    const update = () => {
      prev.disabled = track.scrollLeft <= 10;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 10;
    };
    track.addEventListener("scroll", update);
    update();
  });
}

// ========== OUTFIT CAROUSEL (lookbook style) ==========
function renderOutfitCarousel({ title, sub, items }) {
  if (!items || !items.length) return "";
  return renderCarousel({ title, sub, items: items.flatMap((o) => o.images || [o]), size: "lg" });
}

// ========== COLLECTION GRID ==========
function renderCollectionGrid(collections) {
  if (!collections || !collections.length) return "";
  return `
    <section class="section-title">Bộ sưu tập</section>
    <div class="product-grid">
      ${collections.map((c) => `
        <a class="img-card md" href="#/collection/${c.id}">
          <div class="img-wrap">
            <img src="${escapeHtml(toAbsoluteUrl(c.image || c.imageUrl))}" alt="">
            <div class="overlay-cta"><span class="btn">Xem</span></div>
          </div>
          <div class="info">
            <div class="title">${escapeHtml(c.name || c.title)}</div>
            <div class="meta">${(c.count || 0)} mẫu</div>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

// ========== COMPACT COMPARE ==========
function renderCompactCompare() {
  return `
    <section class="section-title">Xem trước kết quả</section>
    <div style="max-width:480px;margin:0 auto;">
      <div class="compare-slider">
        <img src="https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=800&q=80" alt="Before">
        <span class="label-before">Trước</span>
        <span class="label-after" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);">Sau</span>
        <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" alt="After" style="position:absolute;inset:0;width:50%;height:100%;object-fit:cover;border-right:2px solid white;">
      </div>
      <div class="text-center text-muted mt-1" style="font-size:12px;">Minh hoạ trước/sau khi thử đồ</div>
    </div>
  `;
}

// ========== IMAGE CARD (chỉ ảnh + tiêu đề, KHÔNG GIÁ) ==========
function imageCardHtml(item, size = "md", showTryOn = false) {
  const img = toAbsoluteUrl(item.image || item.imageUrl || (item.images && item.images[0]));
  const title = item.title || item.name || "";
  const meta = item.shop?.name || item.tag || item.category || "";
  const href = item.href || (item.id ? `#/collection/${item.id}` : "#/products");
  const tryOnAttr = item.tryOnEnabled && showTryOn ? '<span class="tag">Try-on</span>' : "";
  return `
    <a class="img-card ${size}" href="${escapeHtml(href)}">
      <div class="img-wrap">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}">
        ${tryOnAttr}
        <div class="overlay-cta">
          ${item.tryOnEnabled && showTryOn ? `<a class="btn" href="#/tryon?product=${escapeHtml(String(item.id || ""))}">✨ Thử ngay</a>` : `<span class="btn">Xem</span>`}
        </div>
      </div>
      <div class="info">
        <div class="title">${escapeHtml(title)}</div>
        ${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}
      </div>
    </a>
  `;
}

// Alias giữ tương thích với code cũ (shop, admin, etc.)
function productCardHtml(p) { return imageCardHtml(p, "md", true); }