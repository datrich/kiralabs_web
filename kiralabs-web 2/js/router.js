// ========== HASH ROUTER ĐƠN GIẢN ==========
const routes = [];
let currentRoute = null;
let beforeUnloadHook = null;

const Router = {
  register(path, opts) {
    const pattern = new RegExp(
      "^" + path.replace(/\//g, "\\/").replace(/:([a-zA-Z_]+)/g, "(?<$1>[^\\/]+)") + "$"
    );
    routes.push({ pattern, path, ...opts });
  },
  match(hash) {
    const path = (hash || "#/").replace(/^#/, "") || "/";
    for (const r of routes) {
      const m = path.match(r.pattern);
      if (m) return { route: r, params: m.groups || {}, path };
    }
    return null;
  },
  go(path) { window.location.hash = "#" + path; },
  async handle() {
    const result = this.match(window.location.hash);
    const container = document.getElementById("app");
    const user = getCurrentUser();

    if (!result) {
      container.innerHTML = `<div class="container page"><div class="empty"><div class="icon">404</div>Trang không tồn tại</div></div>`;
      return;
    }
    const { route, params } = result;
    // Auth routes (login/register/forgot/...) — nếu đã login thì đá về home
    if (route.auth === false && user) { this.go("/home"); return; }
    // Role check (chỉ khi đã login)
    if (route.roles && user && !route.roles.includes(user.role)) { this.go("/home"); return; }
    // Protected routes: render bình thường, page tự xử lý nếu chưa login

    currentRoute = { route, params };
    if (beforeUnloadHook) { try { beforeUnloadHook(); } catch {} beforeUnloadHook = null; }
    container.innerHTML = `<div class="spinner"></div>`;
    try {
      const cleanup = await route.render(container, params);
      beforeUnloadHook = typeof cleanup === "function" ? cleanup : null;
    } catch (e) {
      console.error(e);
      container.innerHTML = `<div class="container page"><div class="alert alert-error">Lỗi: ${e.message}</div></div>`;
    }
    updateNavActive();
  },
};

function updateNavActive() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.classList.toggle("active", window.location.hash === "#" + el.getAttribute("data-nav"));
  });
}
window.addEventListener("hashchange", () => Router.handle());
window.addEventListener("DOMContentLoaded", () => Router.handle());