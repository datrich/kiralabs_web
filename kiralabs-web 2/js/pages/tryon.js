// ========== TRY-ON FLOW (5 bước) — Thẩm mỹ, không icon ==========
const TRYON_STEPS = [
  { key: "select", label: "Bắt đầu", num: "01" },
  { key: "body",   label: "Ảnh của bạn", num: "02" },
  { key: "cloth",  label: "Chọn trang phục", num: "03" },
  { key: "result", label: "Kết quả", num: "04" },
  { key: "video",  label: "Video", num: "05" },
];

function tryonShell(currentKey, contentHtml) {
  const idx = TRYON_STEPS.findIndex((x) => x.key === currentKey);
  const stepsHtml = TRYON_STEPS.map((s, i) => {
    const cls = i === idx ? "active" : i < idx ? "done" : "";
    return `<div class="step ${cls}"><span class="num">${s.num}</span><span class="label">${s.label}</span></div>`;
  }).join("");
  return `
    <div class="container">
      <div class="tryon-header">
        <div class="eyebrow">Trải nghiệm</div>
        <h1 class="tryon-title">Thử đồ ảo</h1>
        <div class="tryon-sub">Trải nghiệm trang phục trong vài giây với công nghệ AI</div>
      </div>
      <div class="steps">${stepsHtml}</div>
      <div id="tryonContent">${contentHtml}</div>
    </div>
  `;
}

function readTryonState() {
  return { personFile: null, personDataUrl: null, pose: null, clothType: "upper", clothProduct: null, clothFile: null, clothUrl: null, result: null };
}
function loadTryonState() {
  try {
    const raw = sessionStorage.getItem("kira_tryon_state");
    if (!raw) return readTryonState();
    return { ...readTryonState(), ...JSON.parse(raw) };
  } catch { return readTryonState(); }
}
function saveTryonState(s) {
  const persist = { ...s, personFile: null, clothFile: null };
  sessionStorage.setItem("kira_tryon_state", JSON.stringify(persist));
}

const POSES = [
  { id: "standing", label: "Đứng thẳng" },
  { id: "casual",   label: "Đi bộ" },
  { id: "hands-up", label: "Tay giơ cao" },
  { id: "sitting",  label: "Ngồi" },
  { id: "side",     label: "Nghiêng" },
  { id: "auto",     label: "Tự động" },
];

const CLOTH_TYPES = [
  { id: "upper",   label: "Áo",      en: "Top" },
  { id: "lower",   label: "Quần",    en: "Bottom" },
  { id: "overall", label: "Cả bộ",   en: "Dress" },
];

Router.register("/tryon", {
  render: async (container) => {
    const user = getCurrentUser();
    const pageContent = tryonShell("select", `
      <div class="card">
        <div class="tryon-step-header">
          <div class="step-num">01 / 05</div>
          <h2 class="step-title">Chọn loại trang phục</h2>
          <p class="step-desc">Bạn muốn thử áo, quần, hay cả bộ? Bạn có thể đổi lựa chọn sau.</p>
        </div>
        <div class="picker-grid">
          ${CLOTH_TYPES.map((t) => `
            <div class="picker-card" data-type="${t.id}">
              <div class="picker-visual">
                <span class="picker-en">${t.en}</span>
              </div>
              <div class="info">
                <div class="picker-label">${t.label}</div>
                <div class="picker-sub">${t.id === "upper" ? "Áo thun, sơ mi, áo khoác" : t.id === "lower" ? "Quần jeans, quần tây, chân váy" : "Đầm, jumpsuit, set"}</div>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="tryon-actions">
          <button class="btn btn-lg" id="btnContinue" disabled>Tiếp tục</button>
        </div>
      </div>
    `);
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);

    let picked = null;
    container.querySelectorAll(".picker-card").forEach((c) => {
      c.addEventListener("click", () => {
        container.querySelectorAll(".picker-card").forEach((x) => x.classList.remove("selected"));
        c.classList.add("selected");
        picked = c.dataset.type;
        container.querySelector("#btnContinue").disabled = false;
      });
    });
    container.querySelector("#btnContinue").addEventListener("click", () => {
      const s = loadTryonState();
      s.clothType = picked;
      saveTryonState(s);
      Router.go("/tryon/body");
    });
  },
});

Router.register("/tryon/body", {
  render: async (container) => {
    const user = getCurrentUser();
    const state = loadTryonState();
    const dataUrl = state.personDataUrl;
    const pageContent = tryonShell("body", `
      <div class="card">
        <div class="tryon-step-header">
          <div class="step-num">02 / 05</div>
          <h2 class="step-title">Tải ảnh của bạn</h2>
          <p class="step-desc">Dùng ảnh chụp rõ người, nền đơn giản để AI xử lý chính xác nhất.</p>
        </div>

        <label class="upload-area" id="dropArea">
          <img class="preview ${dataUrl ? "" : "hidden"}" id="preview" src="${dataUrl || ""}">
          <div class="${dataUrl ? "hidden" : ""}" id="placeholder">
            <div class="upload-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div class="upload-title">Chọn ảnh hoặc kéo thả</div>
            <div class="hint">JPG / PNG · tối đa 10MB</div>
          </div>
          <input type="file" id="fileInput" accept="image/*" style="display:none">
        </label>

        <div class="mt-3">
          <div class="option-label">Tư thế <span class="text-muted">(tuỳ chọn)</span></div>
          <div class="pose-grid">
            ${POSES.map((p) => `
              <div class="pose-card ${state.pose === p.id ? "selected" : ""}" data-pose="${p.id}">
                ${p.label}
              </div>
            `).join("")}
          </div>
        </div>

        <div class="tryon-actions">
          <a class="btn btn-ghost btn-lg" href="#/tryon">Quay lại</a>
          <button class="btn btn-lg" id="btnNext" ${dataUrl ? "" : "disabled"}>Tiếp tục</button>
        </div>
      </div>
    `);
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);

    const fileInput = container.querySelector("#fileInput");
    const preview = container.querySelector("#preview");
    const placeholder = container.querySelector("#placeholder");

    fileInput.addEventListener("change", () => {
      const f = fileInput.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.classList.remove("hidden");
        placeholder.classList.add("hidden");
        const s = loadTryonState();
        s.personFile = f;
        s.personDataUrl = e.target.result;
        saveTryonState(s);
        container.querySelector("#btnNext").disabled = false;
      };
      reader.readAsDataURL(f);
    });

    container.querySelector("#dropArea").addEventListener("click", (e) => {
      if (e.target.tagName === "LABEL" || e.target === preview) fileInput.click();
    });
    container.querySelector("#dropArea").addEventListener("dragover", (e) => { e.preventDefault(); container.querySelector("#dropArea").classList.add("drag"); });
    container.querySelector("#dropArea").addEventListener("dragleave", () => container.querySelector("#dropArea").classList.remove("drag"));
    container.querySelector("#dropArea").addEventListener("drop", (e) => {
      e.preventDefault();
      container.querySelector("#dropArea").classList.remove("drag");
      const f = e.dataTransfer.files[0];
      if (!f) return;
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event("change"));
    });

    container.querySelectorAll(".pose-card").forEach((c) => {
      c.addEventListener("click", () => {
        container.querySelectorAll(".pose-card").forEach((x) => x.classList.remove("selected"));
        c.classList.add("selected");
        const s = loadTryonState();
        s.pose = c.dataset.pose;
        saveTryonState(s);
      });
    });

    container.querySelector("#btnNext").addEventListener("click", () => Router.go("/tryon/cloth"));
  },
});

Router.register("/tryon/cloth", {
  render: async (container) => {
    const user = getCurrentUser();
    const state = loadTryonState();
    let products = [];
    try { products = await Api.products({ tryOn: "1" }); } catch {}
    if (state.clothType && products.length) {
      products = products.filter((p) => !p.clothType || p.clothType === state.clothType || p.clothType === "all");
    }

    const pageContent = tryonShell("cloth", `
      <div class="card">
        <div class="tryon-step-header">
          <div class="step-num">03 / 05</div>
          <h2 class="step-title">Chọn trang phục</h2>
          <p class="step-desc">Chọn một thiết kế bạn muốn thử, hoặc <a href="#" id="uploadCloth">tải lên ảnh của bạn</a>.</p>
        </div>
        <input type="file" id="clothFileInput" accept="image/*" style="display:none">

        <div class="cloth-header">
          <div class="text-muted">${products.length} thiết kế có sẵn</div>
          <span class="chip">Loại: ${state.clothType || "upper"}</span>
        </div>
      </div>
      <div id="clothList" class="carousel-track" style="padding:16px 0 8px;">
        ${products.length ? products.map((p) => imageCardHtml(p, "md", false)).join("") : `<div class="empty">Chưa có sản phẩm có try-on</div>`}
      </div>
      <div class="tryon-actions">
        <a class="btn btn-ghost btn-lg" href="#/tryon/body">Quay lại</a>
        <button class="btn btn-lg" id="btnNext" disabled>Thử đồ</button>
      </div>
    `);
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);

    let selected = null;
    const cards = container.querySelectorAll("#clothList .img-card");
    cards.forEach((c) => {
      c.addEventListener("click", (e) => {
        e.preventDefault();
        cards.forEach((x) => x.classList.remove("selected"));
        c.classList.add("selected");
        const pid = c.getAttribute("href").split("/").pop();
        selected = products.find((p) => String(p.id) === pid);
        const s = loadTryonState();
        s.clothProduct = selected;
        s.clothFile = null;
        saveTryonState(s);
        container.querySelector("#btnNext").disabled = false;
      });
    });

    container.querySelector("#uploadCloth").addEventListener("click", (e) => {
      e.preventDefault();
      container.querySelector("#clothFileInput").click();
    });
    container.querySelector("#clothFileInput").addEventListener("change", () => {
      const f = container.querySelector("#clothFileInput").files[0];
      if (!f) return;
      const s = loadTryonState();
      s.clothFile = f;
      s.clothProduct = null;
      saveTryonState(s);
      toast("Đã chọn ảnh quần áo");
      container.querySelector("#btnNext").disabled = false;
    });
    container.querySelector("#btnNext").addEventListener("click", () => Router.go("/tryon/result"));
  },
});

Router.register("/tryon/result", {
  render: async (container) => {
    const user = getCurrentUser();
    const state = loadTryonState();

    async function renderResult(state) {
      const data = state.result?.data || state.result;
      const url = toAbsoluteUrl(data?.mobile_result_image_url || data?.result_image_url);
      const pageContent = tryonShell("result", `
        <div class="card">
          <div class="tryon-step-header">
            <div class="step-num">04 / 05</div>
            <h2 class="step-title">Hoàn tất</h2>
            <p class="step-desc">Kết quả thử đồ của bạn. Tải về hoặc tạo video ngắn.</p>
          </div>
          <div class="result-image">
            <img src="${escapeHtml(url)}" alt="">
          </div>
          <div class="tryon-actions">
            <a class="btn btn-outline btn-lg" href="${escapeHtml(url)}" target="_blank" download>Tải ảnh</a>
            <button class="btn btn-lg" id="btnVideo">Tạo video</button>
            <a class="btn btn-ghost btn-lg" href="#/tryon">Thử mới</a>
          </div>
        </div>
      `);
      container.innerHTML = await buildPage(user, pageContent);
      bindLayoutEvents(container);
      container.querySelector("#btnVideo").addEventListener("click", () => Router.go("/tryon/video"));
    }

    if (!state.personFile) {
      container.innerHTML = await buildPage(user,
        tryonShell("result", `<div class="alert alert-warning">Bạn chưa chọn ảnh. <a href="#/tryon/body">Quay lại</a></div>`)
      );
      return bindLayoutEvents(container);
    }

    if (!user) {
      const previewUrl = state.personDataUrl || "";
      const clothImg = state.clothProduct ? toAbsoluteUrl(state.clothProduct.image) : "";
      const pageContent = tryonShell("result", `
        <div class="card">
          <div class="tryon-step-header">
            <div class="step-num">04 / 05</div>
            <h2 class="step-title">Sẵn sàng thử đồ</h2>
            <p class="step-desc">Đăng nhập để AI xử lý và tạo ảnh kết quả.</p>
          </div>
          <div class="preview-grid">
            <div class="preview-cell">
              <div class="preview-label">Ảnh của bạn</div>
              <div class="preview-img"><img src="${escapeHtml(previewUrl)}"></div>
            </div>
            ${clothImg ? `
            <div class="preview-cell">
              <div class="preview-label">Trang phục</div>
              <div class="preview-img"><img src="${escapeHtml(clothImg)}"></div>
            </div>` : ""}
          </div>
          <div class="alert alert-info text-center mt-2 mb-2">
            <b>Cần đăng nhập để tiếp tục</b>
          </div>
          <div class="tryon-actions">
            <a class="btn btn-lg" href="#/login">Đăng nhập để thử đồ</a>
            <a class="btn btn-outline btn-lg" href="#/register">Tạo tài khoản</a>
          </div>
          <div class="text-center text-muted mt-2" style="font-size:13px;">
            Hoặc <a href="#" id="quickDemoTryon">thử nhanh với Demo</a>
          </div>
        </div>
      `);
      container.innerHTML = await buildPage(null, pageContent);
      bindLayoutEvents(container);
      const demoLink = container.querySelector("#quickDemoTryon");
      if (demoLink) demoLink.addEventListener("click", (e) => {
        e.preventDefault();
        demoLogin("user");
        toast("Đã vào Demo, đang xử lý...");
        Router.handle();
      });
      return;
    }

    if (state.result && (state.result.mobile_result_image_url || state.result.data)) {
      await renderResult(state);
      return;
    }

    try {
      showLoader(true);
      const fd = new FormData();
      fd.append("person_image", state.personFile);
      fd.append("cloth_type", state.clothType || "upper");
      if (state.pose) fd.append("pose", state.pose);
      if (state.clothFile) fd.append("cloth_image", state.clothFile);
      else if (state.clothProduct) {
        const url = toAbsoluteUrl(state.clothProduct.image || state.clothProduct.imageUrl);
        fd.append("cloth_image_url", url);
      } else {
        throw new Error("Chưa chọn quần áo");
      }
      const r = await Api.tryon(fd);
      state.result = r;
      saveTryonState(state);
      showLoader(false);
      await renderResult(state);
    } catch (e) {
      showLoader(false);
      container.innerHTML = await buildPage(user,
        tryonShell("result", `<div class="alert alert-error">Lỗi try-on: ${escapeHtml(e.message)}</div>
        <div class="tryon-actions"><a class="btn btn-ghost btn-lg" href="#/tryon/cloth">Quay lại chọn đồ</a></div>`)
      );
      bindLayoutEvents(container);
    }
  },
});

Router.register("/tryon/video", {
  render: async (container) => {
    const user = getCurrentUser();
    const state = loadTryonState();
    const data = state.result?.data || state.result;
    if (!state.result) {
      container.innerHTML = await buildPage(user,
        tryonShell("video", `<div class="alert alert-warning">Chưa có kết quả. <a href="#/tryon/result">Bắt đầu</a></div>`)
      );
      return bindLayoutEvents(container);
    }
    const resultImg = toAbsoluteUrl(data?.mobile_result_image_url || data?.result_image_url);

    const pageContent = tryonShell("video", `
      <div class="card">
        <div class="tryon-step-header">
          <div class="step-num">05 / 05</div>
          <h2 class="step-title">Tạo video từ ảnh</h2>
          <p class="step-desc">Biến ảnh tĩnh thành video ngắn với AI. Mất khoảng 1-3 phút.</p>
        </div>
        <div class="video-grid">
          <div class="preview-cell">
            <div class="preview-label">Ảnh gốc</div>
            <div class="preview-img"><img src="${escapeHtml(resultImg)}"></div>
          </div>
          <div class="video-info">
            <div class="info-card">
              <div class="info-row"><span>Chi phí</span><b>5 credits</b></div>
              <div class="info-row"><span>Còn lại</span><b>${user.credits ?? 0} credits</b></div>
            </div>
            <button class="btn btn-block btn-lg" id="btnGen">Bắt đầu tạo video</button>
          </div>
        </div>
        <div id="videoStatus" class="mt-3"></div>
      </div>
    `);
    container.innerHTML = await buildPage(user, pageContent);
    bindLayoutEvents(container);

    const btnGen = container.querySelector("#btnGen");
    btnGen.addEventListener("click", async () => {
      btnGen.disabled = true;
      btnGen.innerHTML = `<span class="spinner-sm"></span> Đang khởi tạo`;
      try {
        const r = await Api.videoGenerate({ imageUrl: resultImg });
        const taskId = r.taskId || r.task_id || r.data?.taskId || "demo_task";
        container.querySelector("#videoStatus").innerHTML = `
          <div class="alert alert-info">
            <span class="spinner-sm"></span> Đang xử lý video
          </div>
        `;
        pollVideo(taskId, btnGen);
      } catch (e) {
        toast(e.message);
        btnGen.disabled = false;
        btnGen.textContent = "Bắt đầu tạo video";
      }
    });

    async function pollVideo(taskId, btn) {
      let attempts = 0;
      const tick = async () => {
        attempts++;
        try {
          const s = await Api.videoStatus(taskId);
          const status = s.status || s.state;
          const videoUrl = s.videoUrl || s.video_url || s.url;
          if (status === "success" || status === "completed" || videoUrl) {
            container.querySelector("#videoStatus").innerHTML = `
              <div class="card">
                <h3 class="mb-2">Video đã sẵn sàng</h3>
                <video src="${escapeHtml(toAbsoluteUrl(videoUrl))}" controls style="width:100%;border-radius:8px;"></video>
                <div class="tryon-actions mt-2">
                  <a class="btn btn-lg" href="${escapeHtml(toAbsoluteUrl(videoUrl))}" target="_blank" download>Tải video</a>
                </div>
              </div>
            `;
            btn.style.display = "none";
            return;
          }
          if (status === "failed" || status === "error") {
            container.querySelector("#videoStatus").innerHTML = `<div class="alert alert-error">Lỗi: ${escapeHtml(s.error || "Không rõ")}</div>`;
            btn.disabled = false;
            btn.textContent = "Thử lại";
            return;
          }
          if (attempts > 60) {
            container.querySelector("#videoStatus").innerHTML = `<div class="alert alert-warning">Quá thời gian chờ</div>`;
            return;
          }
          setTimeout(tick, 2500);
        } catch (e) {
          setTimeout(tick, 4000);
        }
      };
      tick();
    }
  },
});