# Huong Dan Tu Host CatVTON API Va Ket Noi Frontend Qua Ngrok

Tai lieu nay danh cho nguoi co frontend web/app muon tai repo CatVTON ve, tu host backend API tren may cua ho, sau do dung ngrok de public API cho frontend goi.

## 1. Yeu Cau May Chay Backend

May host API can co:

- Windows/Linux co Python.
- GPU NVIDIA va CUDA hoat dong.
- Moi truong Python cai du dependency cua CatVTON.
- Internet de tai model tu Hugging Face trong lan chay dau.
- Ngrok account de tao public HTTPS URL.

Kiem tra CUDA:

```powershell
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
```

Ket qua can co `True`.

## 2. Tai Repo Va Cai Dependency

Tai repo ve may:

```powershell
git clone <REPO_URL>
cd CatVTON
```

Tao va kich hoat virtual environment, neu can:

```powershell
python -m venv venv
.\venv\Scripts\activate
```

Cai dependency goc cua CatVTON:

```powershell
pip install -r requirements.txt
```

Cai dependency rieng cho API:

```powershell
cd catvton_api
pip install -r requirements_api.txt
```

Luu y: `requirements_api.txt` chi gom FastAPI va cac package API. Cac package model nhu `torch`, `diffusers`, `transformers`, `detectron2` van nam trong `requirements.txt` cua CatVTON.

## 3. Chay API Local

Trong thu muc:

```powershell
CatVTON\catvton_api
```

Chay:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

Lan dau chay, backend se load CatVTON model. Qua trinh nay co the mat vai phut vi phai tai checkpoint tu Hugging Face.

Kiem tra API local:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Ket qua dung:

```json
{
  "status": "ok",
  "model": "CatVTON",
  "device": "cuda"
}
```

## 4. Public API Bang Ngrok

Tai ngrok:

```text
https://ngrok.com/download
```

Dang nhap dashboard va lay auth token:

```text
https://dashboard.ngrok.com/get-started/your-authtoken
```

Them token vao ngrok:

```powershell
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

Mo terminal thu hai, giu terminal `uvicorn` van dang chay, sau do chay:

```powershell
ngrok http 8000
```

Ngrok se hien URL dang:

```text
Forwarding  https://abc-xyz.ngrok-free.app -> http://localhost:8000
```

Base API URL de dua cho frontend la:

```text
https://abc-xyz.ngrok-free.app
```

Kiem tra public URL:

```powershell
Invoke-RestMethod https://abc-xyz.ngrok-free.app/health
```

## 5. API Contract Cho Frontend

### Health Check

```http
GET /health
```

Vi du:

```text
GET https://abc-xyz.ngrok-free.app/health
```

Response:

```json
{
  "status": "ok",
  "model": "CatVTON",
  "device": "cuda"
}
```

### Try-On API

```http
POST /api/try-on
```

Content type:

```text
multipart/form-data
```

Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `person_image` | File | Yes | Anh nguoi dau vao |
| `cloth_image` | File | Yes | Anh quan ao |
| `cloth_type` | String | Yes | Chi nhan `upper`, `lower`, hoac `overall` |

Vi du endpoint:

```text
POST https://abc-xyz.ngrok-free.app/api/try-on
```

Response thanh cong:

```json
{
  "success": true,
  "job_id": "9f4d4c7f1d0a45d29f91f3b9e13f4bb1",
  "cloth_type": "upper",
  "person_image_path": "uploads/persons/person_9f4d4c7f1d0a45d29f91f3b9e13f4bb1.png",
  "cloth_image_path": "uploads/clothes/cloth_9f4d4c7f1d0a45d29f91f3b9e13f4bb1.png",
  "result_image_url": "https://abc-xyz.ngrok-free.app/outputs/result_9f4d4c7f1d0a45d29f91f3b9e13f4bb1.png"
}
```

Frontend dung `result_image_url` de hien thi anh ket qua.

## 6. Code Frontend Mau

```html
<input id="person_image" type="file" accept="image/*" />
<input id="cloth_image" type="file" accept="image/*" />

<select id="cloth_type">
  <option value="upper">upper</option>
  <option value="lower">lower</option>
  <option value="overall">overall</option>
</select>

<button id="submit">Try On</button>
<img id="result" style="max-width: 512px;" />

<script>
  const API_BASE_URL = "https://abc-xyz.ngrok-free.app";

  async function runTryOn(personFile, clothFile, clothType) {
    const formData = new FormData();
    formData.append("person_image", personFile);
    formData.append("cloth_image", clothFile);
    formData.append("cloth_type", clothType);

    const response = await fetch(`${API_BASE_URL}/api/try-on`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.detail?.error || data?.error || "Try-on request failed";
      throw new Error(message);
    }

    return data;
  }

  document.querySelector("#submit").addEventListener("click", async () => {
    const personFile = document.querySelector("#person_image").files[0];
    const clothFile = document.querySelector("#cloth_image").files[0];
    const clothType = document.querySelector("#cloth_type").value;

    if (!personFile || !clothFile) {
      alert("Please select both person image and cloth image.");
      return;
    }

    try {
      const result = await runTryOn(personFile, clothFile, clothType);
      document.querySelector("#result").src = result.result_image_url;
    } catch (error) {
      alert(error.message);
    }
  });
</script>
```

## 7. Cau Hinh CORS

API da bat CORS. Mac dinh cho phep moi origin:

```text
CATVTON_CORS_ORIGINS=*
```

Neu frontend da co domain that, nen gioi han CORS:

```powershell
$env:CATVTON_CORS_ORIGINS="https://your-frontend-domain.com"
uvicorn main:app --host 0.0.0.0 --port 8000
```

Neu can nhieu domain:

```powershell
$env:CATVTON_CORS_ORIGINS="http://localhost:3000,https://your-frontend-domain.com"
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 8. Loi Thuong Gap

### `No module named torch`

Ban dang chay sai Python environment. Hay kich hoat dung venv/conda da cai CatVTON.

### `/health` tra model khong load hoac `/api/try-on` tra 503

Xem terminal dang chay `uvicorn`. Thuong la loi CUDA, thieu dependency, hoac chua tai du model.

### `CUDA out of memory`

GPU khong du VRAM hoac co qua nhieu request cung luc. Thu:

- Tat app khac dang dung GPU.
- Restart terminal `uvicorn`.
- Chi cho frontend gui 1 request moi lan.

### Frontend bi CORS

Kiem tra backend da dung code API moi nhat. Neu da set `CATVTON_CORS_ORIGINS`, dam bao domain frontend nam trong danh sach.

### Ngrok URL bi doi

Ngrok free thuong doi URL moi khi restart. Moi lan chay lai `ngrok http 8000`, can cap nhat lai `API_BASE_URL` trong frontend.

## 9. Ghi Chu Van Hanh

- Luon chay song song 2 terminal:
  - Terminal 1: `uvicorn main:app --host 0.0.0.0 --port 8000`
  - Terminal 2: `ngrok http 8000`
- Khong dong terminal nao trong luc frontend dang su dung API.
- API nay xu ly anh va model GPU nen moi request co the mat nhieu giay.
- Neu public cho nguoi khac dung lau dai, nen them API key, gioi han dung luong upload, va rate limit.
