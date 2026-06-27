// ========== UI HELPERS ==========
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function formatPrice(n) {
  if (n == null) return "";
  return Number(n).toLocaleString("vi-VN") + "₫";
}
function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
  if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
  if (diff < 604800) return Math.floor(diff / 86400) + " ngày trước";
  return d.toLocaleDateString("vi-VN");
}
let toastTimer = null;
function toast(msg, ms = 2500) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.style.display = "block";
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = "none"; }, ms);
}
function showLoader(show) {
  let el = document.getElementById("globalLoader");
  if (show) {
    if (!el) { el = document.createElement("div"); el.id = "globalLoader"; el.className = "loader-overlay"; el.innerHTML = `<div class="spinner"></div>`; document.body.appendChild(el); }
    el.style.display = "flex";
  } else if (el) { el.style.display = "none"; }
}
function renderStars(rating) {
  const r = Math.round(rating || 0);
  return "★".repeat(r) + "☆".repeat(5 - r);
}
function pickStarWidget(value, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "star-pick";
  wrap.innerHTML = [1, 2, 3, 4, 5].map((n) => `<span data-v="${n}">★</span>`).join("");
  const setActive = (v) => { wrap.querySelectorAll("span").forEach((s) => s.classList.toggle("active", Number(s.dataset.v) <= v)); };
  setActive(value || 0);
  wrap.addEventListener("click", (e) => { const v = Number(e.target.dataset.v); if (!v) return; setActive(v); onChange && onChange(v); });
  wrap.addEventListener("mouseover", (e) => { const v = Number(e.target.dataset.v); if (v) setActive(v); });
  wrap.addEventListener("mouseleave", () => setActive(value || 0));
  return wrap;
}
function previewFile(input, imgEl) {
  const f = input.files && input.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = (e) => { imgEl.src = e.target.result; };
  reader.readAsDataURL(f);
}
function isDemoToken() { const t = getToken(); return t && t.startsWith("demo_token_"); }
function demoRole() { const t = getToken(); if (!t) return null; return t.replace("demo_token_", ""); }

// Trả về HTML CTA đăng nhập cho các trang cần auth nhưng user chưa login.
function loginRequiredHTML(title, sub) {
  return `
    <div class="container">
      <div class="empty" style="max-width:480px;margin:60px auto;padding:48px 24px;">
        <div class="icon">—</div>
        <h3>${escapeHtml(title || "Cần đăng nhập")}</h3>
        <p style="margin-bottom:20px;">${escapeHtml(sub || "Vui lòng đăng nhập để tiếp tục.")}</p>
        <div class="flex gap-1" style="justify-content:center;">
          <a class="btn" href="#/login">Đăng nhập</a>
          <a class="btn btn-outline" href="#/register">Tạo tài khoản</a>
        </div>
        <div class="mt-3 text-muted" style="font-size:13px;">
          Hoặc thử nhanh: <a href="#" data-action="quick-demo">vào Demo ngay</a>
        </div>
      </div>
    </div>
  `;
}