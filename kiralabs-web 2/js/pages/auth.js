// ========== AUTH PAGES ==========

function authShell(title, sub, contentHtml) {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <h1>${escapeHtml(title)}</h1>
        <div class="sub">${escapeHtml(sub || "")}</div>
        <div id="authContent">${contentHtml}</div>
      </div>
    </div>
  `;
}

// ---- LOGIN ----
Router.register("/login", {
  auth: false,
  render(container) {
    container.innerHTML = authShell(
      "Chào mừng trở lại",
      "Đăng nhập để dùng KiraLabs",
      `
        <form id="fLogin">
          <div class="form-group">
            <label>Email</label>
            <input name="email" type="email" required placeholder="you@example.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label>Mật khẩu</label>
            <input name="password" type="password" required placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="btn btn-block btn-lg" type="submit">Đăng nhập</button>
        </form>

        <div class="auth-divider">hoặc vào demo</div>
        <div class="demo-roles">
          <button class="btn btn-outline" data-demo="user">User</button>
          <button class="btn btn-outline" data-demo="shop">Shop</button>
          <button class="btn btn-gold" data-demo="admin">Admin</button>
        </div>
        <div class="form-hint text-center mt-1">
          Demo dùng dữ liệu giả — không cần tài khoản.
        </div>

        <div class="alt">
          <a href="#/forgot">Quên mật khẩu?</a> · <a href="#/register">Tạo tài khoản</a>
        </div>
      `
    );

    $("#fLogin").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-sm"></span> Đang đăng nhập...`;
      try {
        await Api.login(fd.get("email"), fd.get("password"));
        toast("Đăng nhập thành công");
        Router.go("/home");
      } catch (err) {
        toast(err.message || "Đăng nhập thất bại");
        btn.disabled = false;
        btn.textContent = "Đăng nhập";
      }
    });

    $$("[data-demo]").forEach((b) =>
      b.addEventListener("click", () => {
        const role = b.getAttribute("data-demo");
        demoLogin(role);
        toast(`Đã vào Demo với vai trò ${role}`);
        Router.go("/home");
      })
    );
  },
});

// ---- REGISTER ----
Router.register("/register", {
  auth: false,
  render(container) {
    container.innerHTML = authShell(
      "Tạo tài khoản",
      "Trải nghiệm thử đồ ảo với AI",
      `
        <form id="fRegister">
          <div class="form-group"><label>Họ tên</label><input name="name" type="text" required placeholder="Nguyễn Văn A"></div>
          <div class="form-group"><label>Email</label><input name="email" type="email" required placeholder="you@example.com"></div>
          <div class="form-group"><label>Số điện thoại (tuỳ chọn)</label><input name="phone" type="tel" placeholder="0901234567"></div>
          <div class="form-group"><label>Mật khẩu</label><input name="password" type="password" required minlength="6" placeholder="Tối thiểu 6 ký tự"></div>
          <button class="btn btn-block" type="submit">Đăng ký</button>
        </form>
        <div class="alt">
          <a href="#/login">← Quay lại đăng nhập</a>
          <div class="mt-2">
            <button class="btn btn-outline btn-block" id="btnQuickDemo">Đăng ký + vào Demo luôn</button>
          </div>
        </div>
      `
    );
    $("#fRegister").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-sm"></span> Đang tạo...`;
      try {
        try { await Api.register({ name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"), password: fd.get("password") }); } catch {}
        demoLogin("user");
        toast("Đã vào Demo với vai trò User");
        Router.go("/home");
      } catch (err) {
        toast(err.message);
        btn.disabled = false;
        btn.textContent = "Đăng ký";
      }
    });
    $("#btnQuickDemo").addEventListener("click", () => {
      demoLogin("user");
      toast("Đã vào Demo");
      Router.go("/home");
    });
  },
});

// ---- FORGOT ----
Router.register("/forgot", {
  auth: false,
  render(container) {
    container.innerHTML = authShell("Quên mật khẩu", "Nhập email để nhận mã xác minh", `
      <form id="fForgot">
        <div class="form-group"><label>Email</label><input name="email" type="email" required></div>
        <button class="btn btn-block" type="submit">Gửi mã</button>
      </form>
      <div class="alt"><a href="#/login">← Quay lại đăng nhập</a></div>
    `);
    $("#fForgot").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = new FormData(e.target).get("email");
      try {
        try { await Api.forgotPassword(email); } catch {}
        sessionStorage.setItem("kira_reset_email", email);
        toast("Đã gửi mã (demo)");
        Router.go("/verify-code");
      } catch (err) { toast(err.message); }
    });
  },
});

Router.register("/verify-code", {
  auth: false,
  render(container) {
    const email = sessionStorage.getItem("kira_reset_email") || "";
    container.innerHTML = authShell("Nhập mã xác minh", `Mã đã gửi tới ${escapeHtml(email)}`, `
      <form id="fCode">
        <div class="form-group"><label>Mã 6 số</label><input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="123456"></div>
        <button class="btn btn-block" type="submit">Xác nhận</button>
      </form>
      <div class="alt"><a href="#/forgot">← Gửi lại mã</a></div>
    `);
    $("#fCode").addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = new FormData(e.target).get("code");
      try {
        try { await Api.verifyResetCode(email, code); } catch {}
        sessionStorage.setItem("kira_reset_code", code);
        Router.go("/new-password");
      } catch (err) { toast(err.message); }
    });
  },
});

Router.register("/new-password", {
  auth: false,
  render(container) {
    container.innerHTML = authShell("Mật khẩu mới", "Chọn mật khẩu mới cho tài khoản của bạn", `
      <form id="fNew">
        <div class="form-group"><label>Mật khẩu mới</label><input name="password" type="password" required minlength="6"></div>
        <div class="form-group"><label>Nhập lại</label><input name="password2" type="password" required minlength="6"></div>
        <button class="btn btn-block" type="submit">Đổi mật khẩu</button>
      </form>
    `);
    $("#fNew").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      if (fd.get("password") !== fd.get("password2")) return toast("Mật khẩu nhập lại không khớp");
      try {
        toast("Đổi mật khẩu thành công (demo)");
        sessionStorage.removeItem("kira_reset_email");
        sessionStorage.removeItem("kira_reset_code");
        Router.go("/login");
      } catch (err) { toast(err.message); }
    });
  },
});

Router.register("/verify-email", {
  render(container) {
    const user = getCurrentUser();
    container.innerHTML = authShell("Xác minh email", "Nhập mã 6 số đã gửi tới email", `
      <form id="fEmail">
        <div class="form-group"><label>Mã xác minh</label><input name="code" inputmode="numeric" maxlength="6" required></div>
        <button class="btn btn-block" type="submit">Xác nhận</button>
      </form>
      <div class="alt">Bỏ qua? <a href="#/home">Về trang chủ</a></div>
    `);
    $("#fEmail").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        try { await Api.verifyEmailCode(new FormData(e.target).get("code")); } catch {}
        const u = await Api.me();
        setAuth(getToken(), u);
        toast("Xác minh thành công!");
        Router.go("/home");
      } catch (err) { toast(err.message); }
    });
  },
});