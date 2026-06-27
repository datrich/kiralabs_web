const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'local_secret';
const RESET_CODE_EXPIRES_MINUTES = Number(process.env.RESET_CODE_EXPIRES_MINUTES || 10);
const RESET_TOKEN_EXPIRES = process.env.RESET_TOKEN_EXPIRES || '10m';
const uploadDir = 'uploads';
const publicDir = path.join(__dirname, 'public');
const staticDir = path.join(publicDir, 'static');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir, { recursive: true });

const upload = multer({ dest: uploadDir });
const TRYON_API_URL = process.env.TRYON_API_URL || 'http://localhost:8000';

// Credit thưởng cho shop khi 1 sản phẩm được admin duyệt
const CREDIT_REWARD_PER_PRODUCT = 10;

// Lưu ảnh sản phẩm vào public/static để serve công khai qua /static
const productImagesDir = path.join(staticDir, 'images', 'products');
if (!fs.existsSync(productImagesDir)) fs.mkdirSync(productImagesDir, { recursive: true });
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productImagesDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    cb(null, `product_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const uploadProduct = multer({ storage: productStorage });

function normalizeHostUrlForBackend(url) {
  if (!url) return url;
  // Ép về 127.0.0.1 (IPv4) — trên Windows 'localhost' hay phân giải sang IPv6 ::1 gây treo/lỗi kết nối
  return String(url).replace('http://10.0.2.2:', 'http://127.0.0.1:').replace('http://localhost:', 'http://127.0.0.1:');
}

async function downloadImageToUploadFile(imageUrl) {
  // Nếu là ảnh tĩnh của chính server (/static/...): copy thẳng từ ổ đĩa, KHỎI tải HTTP
  // (tránh lỗi tự-gọi-HTTP qua localhost/IPv6 trên Windows). Copy ra file tạm để bước dọn dẹp
  // không xóa nhầm ảnh gốc của sản phẩm.
  const marker = '/static/';
  const idx = imageUrl ? imageUrl.indexOf(marker) : -1;
  if (idx !== -1) {
    const relative = imageUrl.substring(idx + marker.length).split('?')[0]; // images/products/xxx.jpg
    const srcPath = path.join(staticDir, relative);
    if (fs.existsSync(srcPath)) {
      const ext = (path.extname(srcPath) || '.jpg').toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const dest = `${uploadDir}/cloth_from_static_${Date.now()}${ext}`;
      fs.copyFileSync(srcPath, dest);
      return { path: dest, originalname: path.basename(srcPath), mimetype: mime };
    }
  }

  // Ngược lại: tải qua HTTP (đã ép IPv4 ở normalizeHostUrlForBackend)
  const safeUrl = normalizeHostUrlForBackend(imageUrl);
  const filePath = `${uploadDir}/cloth_from_url_${Date.now()}.jpg`;
  const response = await axios.get(safeUrl, { responseType: 'stream', timeout: 1000 * 60 * 2 });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return { path: filePath, originalname: 'cloth_from_app.jpg', mimetype: response.headers['content-type'] || 'image/jpeg' };
}

app.use(cors());
app.use(express.json());
app.use('/static', express.static(staticDir));

function normalizeEmail(email) { return email ? String(email).trim().toLowerCase() : null; }
function normalizePhone(phoneNumber) { return phoneNumber ? String(phoneNumber).trim() : null; }

function publicUser(user) {
  return {
    id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl, dateOfBirth: user.dateOfBirth,
    gender: user.gender, email: user.email, phoneNumber: user.phoneNumber, role: user.role,
    isEmailVerified: Boolean(user.isEmailVerified), createdAt: user.createdAt, lastLoginAt: user.lastLoginAt, credits: user.credits,
    isSuperAdmin: Boolean(user.isSuperAdmin),
  };
}

function toAbsoluteImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (String(imagePath).startsWith('http://') || String(imagePath).startsWith('https://')) return imagePath;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${imagePath}`;
}

function getAuthTypeAndIdentifier(identifierRaw) {
  const raw = String(identifierRaw || '').trim();
  const looksLikeEmail = raw.includes('@');
  return { authType: looksLikeEmail ? 'email_password' : 'phone_password', identifier: looksLikeEmail ? normalizeEmail(raw) : normalizePhone(raw), isEmail: looksLikeEmail };
}

function generateResetCode() { return String(Math.floor(1000 + Math.random() * 9000)); }

function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

async function sendPasswordResetEmail(toEmail, code) {
  const transporter = getMailTransporter();
  if (!transporter || !toEmail) return false;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from, to: toEmail, subject: 'Kira Labs password reset code',
    text: `Your Kira Labs verification code is ${code}. This code expires in ${RESET_CODE_EXPIRES_MINUTES} minutes.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2>Kira Labs password reset</h2><p>Your verification code is:</p><div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</div><p>This code expires in ${RESET_CODE_EXPIRES_MINUTES} minutes.</p></div>`,
  });
  return true;
}

app.get('/home-content', async (req, res) => {
  try {
    // Danh mục lấy từ bảng Category (nguồn thật). Ảnh: ưu tiên ảnh curated của HomeCategory (theo slug),
    // nếu không có thì lấy ảnh 1 sản phẩm đã duyệt trong danh mục. Danh mục mới chỉ hiện khi có >=1 sản phẩm duyệt.
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const homeCats = await prisma.homeCategory.findMany();
    const homeBySlug = {};
    homeCats.forEach((h) => { homeBySlug[h.slug] = h; });

    const result = [];
    for (const c of cats) {
      const curated = homeBySlug[c.slug];
      const approvedCount = await prisma.product.count({ where: { categoryId: c.id, isApproved: 1, isActive: 1 } });
      if (!curated && approvedCount === 0) continue; // bỏ danh mục mới chưa có hàng được duyệt

      let imageUrl = curated ? toAbsoluteImageUrl(req, curated.imagePath) : null;
      if (!imageUrl) {
        const rep = await prisma.product.findFirst({
          where: { categoryId: c.id, isApproved: 1, isActive: 1, NOT: { imageUrl: null } },
          orderBy: { id: 'desc' },
        });
        if (rep) imageUrl = toAbsoluteImageUrl(req, rep.imageUrl);
      }

      result.push({ id: c.id, label: c.name, slug: c.slug, imageUrl, sortOrder: curated ? curated.sortOrder : 999 });
    }
    result.sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id));

    const banner = await prisma.homeBanner.findFirst({ where: { isActive: 1 }, orderBy: { sortOrder: 'asc' } });
    return res.json({
      categories: result,
      banner: banner ? { ...banner, imageUrl: toAbsoluteImageUrl(req, banner.imagePath) } : null,
    });
  } catch (error) { console.error('HOME_CONTENT_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

app.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.homeCategory.findMany({ orderBy: { sortOrder: 'asc' } });
    return res.json({ categories: categories.map((c) => ({ ...c, imageUrl: toAbsoluteImageUrl(req, c.imagePath) })) });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

app.get('/health', (req, res) => { res.json({ message: 'Kira Labs API is running' }); });

app.post('/auth/register', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = normalizeEmail(req.body.email);
    const phoneNumber = normalizePhone(req.body.phoneNumber);
    const password = String(req.body.password || '');
    const gender = req.body.gender || 'unspecified';
    const dateOfBirth = req.body.dateOfBirth || null;

    if (!fullName || !password || (!email && !phoneNumber)) return res.status(400).json({ message: 'Thiếu thông tin' });
    if (password.length < 6) return res.status(400).json({ message: 'Mật khẩu cần ít nhất 6 ký tự' });

    const authType = email ? 'email_password' : 'phone_password';
    const identifier = email || phoneNumber;

    const existedAuth = await prisma.userAuthMethod.findUnique({ where: { authType_identifier: { authType, identifier } } });
    if (existedAuth) return res.status(409).json({ message: 'Tài khoản đã tồn tại' });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { fullName, email, phoneNumber, gender, dateOfBirth } });
      await tx.userAuthMethod.create({ data: { userId: user.id, authType, identifier, passwordHash } });
      return user;
    });

    if (email) {
      await createNotification(result.id, 'verify_email', 'Xác minh email của bạn',
        'Xác minh email để mở khóa tính năng tạo video try-on.', null);
    }
    return res.status(201).json({ message: 'Đăng ký thành công', user: publicUser(result) });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

app.post('/auth/login', async (req, res) => {
  try {
    const identifierRaw = String(req.body.identifier || req.body.email || req.body.phoneNumber || '').trim();
    const password = String(req.body.password || '');
    if (!identifierRaw || !password) return res.status(400).json({ message: 'Thiếu thông tin' });

    const looksLikeEmail = identifierRaw.includes('@');
    const authType = looksLikeEmail ? 'email_password' : 'phone_password';
    const identifier = looksLikeEmail ? normalizeEmail(identifierRaw) : normalizePhone(identifierRaw);

    const authMethod = await prisma.userAuthMethod.findUnique({ where: { authType_identifier: { authType, identifier } }, include: { user: true } });
    if (!authMethod || !authMethod.passwordHash) return res.status(401).json({ message: 'Sai thông tin' });

    const isMatch = await bcrypt.compare(password, authMethod.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Sai thông tin' });

    const updatedUser = await prisma.user.update({ where: { id: authMethod.userId }, data: { lastLoginAt: new Date().toISOString() } });
    const token = jwt.sign({ userId: updatedUser.id, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ message: 'Đăng nhập thành công', token, user: publicUser(updatedUser) });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Thiếu token' });
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) { return res.status(401).json({ message: 'Token hết hạn' }); }
}

// Middleware phân quyền: dùng SAU authMiddleware.
// Luôn đọc role mới nhất từ DB (không tin role trong token vì admin có thể đổi role sau khi user đã login).
// Ví dụ: app.get('/admin/stats', authMiddleware, requireRole('admin'), handler)
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
      if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Bạn không có quyền dùng chức năng này' });
      }
      req.user = user; // gắn user mới nhất để route phía sau dùng lại, khỏi query DB thêm lần nữa
      return next();
    } catch (error) { return res.status(500).json({ message: 'Lỗi kiểm tra quyền' }); }
  };
}

// Middleware chỉ cho Super Admin (quyền cao nhất). Dùng SAU authMiddleware.
function requireSuperAdmin(req, res, next) {
  return (async () => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
      if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
      if (!user.isSuperAdmin) return res.status(403).json({ message: 'Chỉ Super Admin mới có quyền này' });
      req.user = user;
      return next();
    } catch (error) { return res.status(500).json({ message: 'Lỗi kiểm tra quyền' }); }
  })();
}

app.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    return res.json({ user: publicUser(user) });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

app.post('/users/me/send-verify', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    if (!user || !user.email) return res.status(400).json({ message: 'Không tìm thấy Email' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email đã được xác minh' });

    const code = generateResetCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.passwordResetCode.create({
      data: { userId: user.id, authType: 'email_verify', identifier: user.email, codeHash, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString() },
    });

    await sendPasswordResetEmail(user.email, code); 
    return res.json({ message: 'Đã gửi mã', devCode: code }); 
  } catch (error) { return res.status(500).json({ message: 'Lỗi gửi mã' }); }
});

app.post('/users/me/verify-code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    const resetCodes = await prisma.passwordResetCode.findMany({ where: { userId: user.id, authType: 'email_verify', usedAt: null }, orderBy: { id: 'desc' }, take: 1 });
    if (!resetCodes.length) return res.status(400).json({ message: 'Mã không tồn tại' });
    
    const isMatch = await bcrypt.compare(code, resetCodes[0].codeHash);
    if (!isMatch) return res.status(400).json({ message: 'Mã không đúng' });

    await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: 1 } });
    await prisma.passwordResetCode.update({ where: { id: resetCodes[0].id }, data: { usedAt: new Date().toISOString() } });
    return res.json({ message: 'Xác minh thành công' });
  } catch (error) { return res.status(500).json({ message: 'Lỗi xác minh' }); }
});

// 3. API Lấy lịch sử Try-on
app.get('/api/history', authMiddleware, async (req, res) => {
  try {
    const history = await prisma.tryonHistory.findMany({
      where: { userId: req.auth.userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ history });
  } catch (error) { return res.status(500).json({ message: 'Lỗi lấy lịch sử' }); }
});

// BỔ SUNG THÊM API NÀY ĐỂ APP GỬI LINK VIDEO LÊN LƯU VÀO LỊCH SỬ
app.post('/api/history', authMiddleware, async (req, res) => {
  try {
    const { mediaUrl } = req.body;
    if (!mediaUrl) return res.status(400).json({ message: 'Thiếu mediaUrl' });
    
    // Tạm dùng chung cột imageUrl trong Database để lưu link Video cho tiện
    await prisma.tryonHistory.create({
      data: { userId: req.auth.userId, imageUrl: mediaUrl }
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('LỖI LƯU LỊCH SỬ VIDEO:', error);
    return res.status(500).json({ message: 'Lỗi lưu lịch sử video' });
  }
});

// 4. Cơ chế dọn rác (Cron job thu nhỏ): Xóa lịch sử cũ hơn 24h mỗi giờ
setInterval(async () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    await prisma.tryonHistory.deleteMany({ where: { createdAt: { lt: yesterday } } });
    console.log('[SYSTEM] Đã dọn dẹp ảnh Try-on cũ hơn 24h');
  } catch (e) { }
}, 60 * 60 * 1000); 

app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') return res.json({ results: [] });
    const products = await prisma.product.findMany({ where: { OR: [{ name: { contains: query } }, { description: { contains: query } }], isActive: 1, isApproved: 1 }, include: { category: true }, take: 20 });
    const formattedProducts = products.map(p => ({ ...p, imageUrl: toAbsoluteImageUrl(req, p.imageUrl), category: p.category ? { ...p.category, imageUrl: toAbsoluteImageUrl(req, p.category.imageUrl) } : null }));
    return res.json({ results: formattedProducts });
  } catch (error) { return res.status(500).json({ message: 'Lỗi tìm kiếm' }); }
});

app.post(
  '/tryon',
  authMiddleware,
  upload.fields([{ name: 'person_image', maxCount: 1 }, { name: 'cloth_image', maxCount: 1 }]),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
      if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
      const isAdmin = user.role === 'admin'; // admin không bị giới hạn credit
      if (!isAdmin && user.credits < 1) return res.status(403).json({ message: 'Bạn đã hết Credit! Vui lòng nạp thêm để tiếp tục.' });

      const personFile = req.files?.person_image?.[0];
      let clothFile = req.files?.cloth_image?.[0] || null;
      const clothImageUrl = req.body.cloth_image_url;
      const clothType = req.body.cloth_type;
      const uploadedFiles = [];

      if (!personFile) return res.status(400).json({ message: 'Thiếu person_image' });
      if (!clothFile && !clothImageUrl) return res.status(400).json({ message: 'Thiếu cloth_image hoặc cloth_image_url' });
      if (!['upper', 'lower', 'overall'].includes(clothType)) return res.status(400).json({ message: 'cloth_type phải là upper, lower hoặc overall' });

      uploadedFiles.push(personFile.path);
      if (!clothFile && clothImageUrl) clothFile = await downloadImageToUploadFile(clothImageUrl);
      uploadedFiles.push(clothFile.path);

      const form = new FormData();
      form.append('person_image', fs.createReadStream(personFile.path), { filename: personFile.originalname || 'person.jpg', contentType: personFile.mimetype });
      form.append('cloth_image', fs.createReadStream(clothFile.path), { filename: clothFile.originalname || 'cloth.jpg', contentType: clothFile.mimetype || 'image/jpeg' });
      form.append('cloth_type', clothType);

      const response = await axios.post(`${TRYON_API_URL}/api/try-on`, form, { headers: form.getHeaders(), timeout: 1000 * 60 * 20, maxBodyLength: Infinity, maxContentLength: Infinity });
      const result = response.data;

      // 1. Tạo link URL chuẩn trước
      if (result.result_image_url) {
        result.mobile_result_image_url = result.result_image_url
          .replace('http://localhost:8000', 'http://10.0.2.2:8000')
          .replace('http://127.0.0.1:8000', 'http://10.0.2.2:8000');
      }

      // 2. CÓ LINK RỒI MỚI LƯU LỊCH SỬ VÀO DATABASE ĐỂ TRÁNH LỖI
      if (result.mobile_result_image_url) {
        await prisma.tryonHistory.create({ 
          data: { userId: user.id, imageUrl: result.mobile_result_image_url } 
        });
      }

      // 3. Trừ Credit sau khi Try-on thành công (admin được miễn)
      if (!isAdmin) {
        await prisma.user.update({ where: { id: user.id }, data: { credits: user.credits - 1 } });
      }

      uploadedFiles.forEach((filePath) => { fs.unlink(filePath, () => {}); });
      return res.json({ message: 'Try-on thành công', data: result, remainingCredits: isAdmin ? user.credits : user.credits - 1 });
    } catch (error) {
      console.error('TRYON_ERROR:', error.response?.data || error.message);
      return res.status(500).json({ message: 'Lỗi khi chạy try-on model', error: error.response?.data || error.message });
    }
  }
);

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE = "https://api.kie.ai";
const KIE_UPLOAD_BASE = "https://kieai.redpandaai.co";

app.post('/api/video/generate', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    const isAdmin = user.role === 'admin'; // admin không bị giới hạn credit
    if (!isAdmin && user.credits < 1) return res.status(403).json({ success: false, message: 'Bạn đã hết Credit! Vui lòng nạp thêm để tiếp tục.' });

    const { imageUrl, prompt } = req.body;
    if (!imageUrl) return res.status(400).json({ message: 'Thiếu imageUrl' });
    if (!KIE_API_KEY) throw new Error('Thiếu KIE_API_KEY trong file .env');

    const localFile = await downloadImageToUploadFile(imageUrl);
    const form = new FormData();
    form.append('file', fs.createReadStream(localFile.path), { filename: localFile.originalname, contentType: localFile.mimetype });
    form.append('uploadPath', 'images/virtual-tryon');
    form.append('fileName', `tryon_video_${Date.now()}.jpg`);

    const uploadRes = await axios.post(`${KIE_UPLOAD_BASE}/api/file-stream-upload`, form, { headers: { ...form.getHeaders(), "Authorization": `Bearer ${KIE_API_KEY}` }, timeout: 120000 });
    if (!uploadRes.data.success) throw new Error('Upload ảnh lên KIE thất bại');

    const kieImageUrl = uploadRes.data.data.downloadUrl;
    fs.unlink(localFile.path, () => {});

    const userPrompt = prompt ? prompt.trim() : "A realistic virtual try-on fashion preview.";
    const baseConstraint = "Keep the outfit, face, body shape, clothing color, texture, and background consistent. Avoid body warping, face distortion, clothing flicker, and changing clothes.";
    const finalPrompt = `${userPrompt}. ${baseConstraint}`;

    const payload = { "model": "bytedance/v1-lite-image-to-video", "input": { "prompt": finalPrompt, "image_url": kieImageUrl, "resolution": "480p", "duration": "5", "camera_fixed": true } };
    const taskRes = await axios.post(`${KIE_API_BASE}/api/v1/jobs/createTask`, payload, { headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" } });

    if (taskRes.data.code !== 200) throw new Error(`Tạo task thất bại: ${JSON.stringify(taskRes.data)}`);
    const taskId = taskRes.data.data.taskId;

    if (!isAdmin) {
      await prisma.user.update({ where: { id: user.id }, data: { credits: user.credits - 1 } });
    }
    return res.json({ success: true, taskId, remainingCredits: isAdmin ? user.credits : user.credits - 1 });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi server khi khởi tạo video' });
  }
});

app.get('/api/video/status/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await axios.get(`${KIE_API_BASE}/api/v1/jobs/recordInfo`, { params: { taskId }, headers: { "Authorization": `Bearer ${KIE_API_KEY}` } });
    const state = response.data.data.state;
    if (state === 'success') {
      const resultJsonRaw = response.data.data.resultJson;
      const resultJson = typeof resultJsonRaw === 'string' ? JSON.parse(resultJsonRaw) : resultJsonRaw;
      const videoUrl = resultJson.videoUrl || resultJson.url || (resultJson.resultUrls && resultJson.resultUrls[0]) || (resultJson.videos && resultJson.videos[0].url);
      return res.json({ success: true, state, videoUrl });
    }
    return res.json({ success: true, state });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái video' });
  }
});

// ============================================================
// ============ PHASE 2: ĐĂNG KÝ & DUYỆT SHOP =================
// ============================================================

// [USER] Nộp đơn đăng ký trở thành Shop. Admin duyệt mới được lên role 'shop'.
app.post('/shop/apply', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId }, include: { shop: true } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Tài khoản admin không cần đăng ký shop' });
    if (user.role === 'shop') return res.status(400).json({ message: 'Bạn đã là shop rồi' });

    const shopName = String(req.body.shopName || '').trim();
    const address = String(req.body.address || '').trim();
    const phone = req.body.phone ? String(req.body.phone).trim() : null;
    const description = req.body.description ? String(req.body.description).trim() : null;
    if (!shopName || !address) return res.status(400).json({ message: 'Cần nhập tên shop và địa chỉ' });

    const now = new Date().toISOString();

    // Đã có hồ sơ shop trước đó
    if (user.shop) {
      if (user.shop.status === 'pending') return res.status(409).json({ message: 'Đơn đăng ký của bạn đang chờ duyệt' });
      // Trạng thái rejected -> cho phép nộp lại
      const updated = await prisma.shop.update({
        where: { id: user.shop.id },
        data: { shopName, address, phone, description, status: 'pending', rejectReason: null, updatedAt: now },
      });
      await notifyAdmins('shop_pending', 'Có shop chờ duyệt', `${shopName} vừa gửi lại đơn đăng ký`, { shopId: updated.id });
      return res.json({ message: 'Đã gửi lại đơn đăng ký, chờ admin duyệt', shop: updated });
    }

    const created = await prisma.shop.create({
      data: { userId: user.id, shopName, address, phone, description, status: 'pending', createdAt: now, updatedAt: now },
    });
    await notifyAdmins('shop_pending', 'Có shop mới chờ duyệt', `${shopName} vừa đăng ký bán hàng`, { shopId: created.id });
    return res.status(201).json({ message: 'Đã gửi đơn đăng ký shop, chờ admin duyệt', shop: created });
  } catch (error) {
    console.error('SHOP_APPLY_ERROR:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// [USER/SHOP] Xem trạng thái hồ sơ shop của chính mình (để UI hiện "đang chờ duyệt" / "đã duyệt" / lý do từ chối)
app.get('/shop/me', authMiddleware, async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { userId: req.auth.userId } });
    return res.json({ shop: shop || null });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [ADMIN] Danh sách đơn đăng ký shop. Lọc theo ?status=pending|approved|rejected (không truyền = tất cả)
app.get('/admin/shops', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const where = status ? { status } : {};
    const shops = await prisma.shop.findMany({ where, orderBy: { id: 'desc' }, include: { user: true } });
    const data = shops.map((s) => ({
      id: s.id, shopName: s.shopName, address: s.address, phone: s.phone, description: s.description,
      status: s.status, rejectReason: s.rejectReason, createdAt: s.createdAt, approvedAt: s.approvedAt,
      user: s.user ? { id: s.user.id, fullName: s.user.fullName, email: s.user.email, phoneNumber: s.user.phoneNumber, role: s.user.role } : null,
    }));
    return res.json({ shops: data });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [ADMIN] Duyệt shop -> đổi role user thành 'shop'
app.post('/admin/shops/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const shopId = Number(req.params.id);
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(404).json({ message: 'Không tìm thấy shop' });
    if (shop.status === 'approved') return res.status(400).json({ message: 'Shop này đã được duyệt rồi' });

    const now = new Date().toISOString();
    await prisma.$transaction([
      prisma.shop.update({ where: { id: shopId }, data: { status: 'approved', approvedAt: now, rejectReason: null, updatedAt: now } }),
      prisma.user.update({ where: { id: shop.userId }, data: { role: 'shop', updatedAt: now } }),
    ]);
    await createNotification(shop.userId, 'shop_approved', 'Đăng ký shop đã được duyệt',
      'Chúc mừng! Bạn đã trở thành người bán trên KiraLabs.', { shopId });
    return res.json({ message: 'Đã duyệt shop thành công' });
  } catch (error) { console.error('SHOP_APPROVE_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [ADMIN] Từ chối shop (role user giữ nguyên). Có thể kèm lý do trong body: { reason }
app.post('/admin/shops/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const shopId = Number(req.params.id);
    const reason = req.body.reason ? String(req.body.reason).trim() : null;
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(404).json({ message: 'Không tìm thấy shop' });

    const now = new Date().toISOString();
    await prisma.$transaction([
      prisma.shop.update({ where: { id: shopId }, data: { status: 'rejected', rejectReason: reason, updatedAt: now } }),
      // Nếu user đang là 'shop' mà bị từ chối lại (trường hợp hiếm) thì hạ về 'user'
      prisma.user.update({ where: { id: shop.userId }, data: { role: 'user', updatedAt: now } }),
    ]);
    await createNotification(shop.userId, 'shop_rejected', 'Đăng ký shop bị từ chối',
      reason || 'Vui lòng kiểm tra lại thông tin và gửi lại đơn.', { shopId });
    return res.json({ message: 'Đã từ chối đơn đăng ký shop' });
  } catch (error) { console.error('SHOP_REJECT_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [ADMIN] Thống kê tổng quan: số user theo role, số shop, số sản phẩm
app.get('/admin/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [totalUsers, userCount, shopCount, adminCount, pendingShops, approvedShops, totalProducts, pendingProducts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.user.count({ where: { role: 'shop' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.shop.count({ where: { status: 'pending' } }),
      prisma.shop.count({ where: { status: 'approved' } }),
      prisma.product.count(),
      prisma.product.count({ where: { isApproved: 0 } }),
    ]);
    return res.json({
      stats: {
        totalUsers,
        byRole: { user: userCount, shop: shopCount, admin: adminCount },
        shops: { pending: pendingShops, approved: approvedShops },
        products: { total: totalProducts, pendingApproval: pendingProducts },
      },
    });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// ============================================================
// ============ SUPER ADMIN: QUẢN LÝ QUYỀN ADMIN ==============
// ============================================================

// [SUPER ADMIN] Danh sách tài khoản (tìm theo tên/email/sđt qua ?search=)
app.get('/admin/users', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const where = search
      ? { OR: [{ fullName: { contains: search } }, { email: { contains: search } }, { phoneNumber: { contains: search } }] }
      : {};
    const users = await prisma.user.findMany({ where, orderBy: { id: 'asc' }, take: 200 });
    const data = users.map((u) => ({
      id: u.id, fullName: u.fullName, email: u.email, phoneNumber: u.phoneNumber,
      role: u.role, isSuperAdmin: Boolean(u.isSuperAdmin), credits: u.credits,
    }));
    return res.json({ users: data });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [SUPER ADMIN] Cấp quyền admin cho 1 user
app.post('/superadmin/users/:id/promote-admin', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'Không tìm thấy user' });
    if (target.role === 'admin') return res.status(400).json({ message: 'Tài khoản này đã là admin' });
    await prisma.user.update({ where: { id }, data: { role: 'admin', updatedAt: new Date().toISOString() } });
    await createNotification(id, 'admin_granted', 'Bạn đã được cấp quyền Admin',
      'Bạn giờ có thể duyệt shop, duyệt sản phẩm và xem thống kê hệ thống. Đăng nhập lại để áp dụng.', null);
    return res.json({ message: 'Đã cấp quyền admin' });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [SUPER ADMIN] Thu hồi quyền admin (về 'user'). Không hạ được Super Admin và chính mình.
app.post('/superadmin/users/:id/demote-admin', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === req.auth.userId) return res.status(400).json({ message: 'Không thể tự hạ quyền chính mình' });
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'Không tìm thấy user' });
    if (target.isSuperAdmin) return res.status(403).json({ message: 'Không thể hạ quyền Super Admin' });
    if (target.role !== 'admin') return res.status(400).json({ message: 'Tài khoản này không phải admin' });
    await prisma.user.update({ where: { id }, data: { role: 'user', updatedAt: new Date().toISOString() } });
    await createNotification(id, 'admin_revoked', 'Quyền Admin đã bị thu hồi',
      'Tài khoản của bạn đã trở về quyền người dùng thường. Đăng nhập lại để áp dụng.', null);
    return res.json({ message: 'Đã thu hồi quyền admin' });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// ============================================================
// ============ PHASE 3: SẢN PHẨM (SHOP + ADMIN) =============
// ============================================================

// Tính trạng thái sản phẩm để hiển thị (pending/approved/rejected)
function productStatus(p) {
  if (p.isApproved) return 'approved';
  if (!p.isActive) return 'rejected';
  return 'pending';
}
function formatProduct(req, p) {
  return {
    id: p.id, name: p.name, description: p.description, price: p.price,
    clothType: p.clothType, imageUrl: toAbsoluteImageUrl(req, p.imageUrl),
    categoryId: p.categoryId, categoryName: p.category ? p.category.name : null,
    shopId: p.shopId, shopName: p.shop ? p.shop.shopName : null, shopAddress: p.shop ? p.shop.address : null,
    isActive: p.isActive, isApproved: p.isApproved, tryOnEnabled: p.tryOnEnabled,
    status: productStatus(p), createdAt: p.createdAt,
  };
}

// Tạo slug từ tên (bỏ dấu tiếng Việt)
function slugify(str) {
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Tạo 1 thông báo cho 1 user
async function createNotification(userId, type, title, body = null, data = null) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, data: data ? JSON.stringify(data) : null, isRead: 0, createdAt: new Date().toISOString() },
    });
  } catch (e) { console.error('NOTIF_ERROR:', e); }
}

// Gửi thông báo cho tất cả admin (gồm cả super admin)
async function notifyAdmins(type, title, body = null, data = null) {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
    await Promise.all(admins.map((a) => createNotification(a.id, type, title, body, data)));
  } catch (e) { console.error('NOTIF_ADMINS_ERROR:', e); }
}

// [PUBLIC] Danh mục sản phẩm (cho form đăng sản phẩm chọn category)
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    return res.json({ categories: cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [SHOP/ADMIN] Tạo danh mục mới (hoặc trả về danh mục đã tồn tại)
app.post('/api/categories', authMiddleware, requireRole('shop', 'admin'), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Cần nhập tên danh mục' });
    const slug = slugify(name) || `cat-${Date.now()}`;
    let cat = await prisma.category.findFirst({ where: { OR: [{ slug }, { name }] } });
    if (cat) return res.json({ category: { id: cat.id, name: cat.name, slug: cat.slug }, existed: true });
    const now = new Date().toISOString();
    cat = await prisma.category.create({ data: { name, slug, createdAt: now, updatedAt: now } });
    return res.status(201).json({ category: { id: cat.id, name: cat.name, slug: cat.slug }, existed: false });
  } catch (error) { console.error('CATEGORY_CREATE_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [PUBLIC] Danh sách sản phẩm đã duyệt. Lọc: ?category=<tên>&categorySlug=&categoryId=&shopId=&q=&tryOn=1
app.get('/api/products', async (req, res) => {
  try {
    const { categoryId, categorySlug, category, categoryName, shopId, q, tryOn } = req.query;
    const where = { isActive: 1, isApproved: 1 };
    if (shopId) where.shopId = Number(shopId);
    if (tryOn === '1') where.tryOnEnabled = 1;
    if (q) where.OR = [{ name: { contains: String(q) } }, { description: { contains: String(q) } }];

    if (categoryId) {
      where.categoryId = Number(categoryId);
    } else if (categorySlug || category || categoryName) {
      const cat = await prisma.category.findFirst({
        where: categorySlug ? { slug: String(categorySlug) } : { name: String(category || categoryName) },
      });
      if (!cat) return res.json({ products: [] });
      where.categoryId = cat.id;
    }

    const products = await prisma.product.findMany({ where, orderBy: { id: 'desc' }, include: { category: true, shop: true } });
    return res.json({ products: products.map((p) => formatProduct(req, p)) });
  } catch (error) { console.error('PRODUCTS_LIST_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [PUBLIC] Chi tiết 1 sản phẩm
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await prisma.product.findUnique({ where: { id }, include: { category: true, shop: true } });
    if (!p) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    const formatted = formatProduct(req, p);
    // Tính điểm review — nếu lỗi (vd bảng reviews chưa tạo) thì vẫn trả sản phẩm với điểm 0
    try {
      const [count, avgAgg] = await Promise.all([
        prisma.review.count({ where: { productId: id } }),
        prisma.review.aggregate({ where: { productId: id }, _avg: { rating: true } }),
      ]);
      formatted.reviewCount = count;
      formatted.avgRating = avgAgg._avg.rating || 0;
    } catch (revErr) {
      console.error('REVIEW_AGG_ERROR (sản phẩm vẫn tải được):', revErr?.message);
      formatted.reviewCount = 0;
      formatted.avgRating = 0;
    }
    return res.json({ product: formatted });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [PUBLIC] Danh sách đánh giá của 1 sản phẩm + tóm tắt (điểm TB, số lượt)
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const reviews = await prisma.review.findMany({ where: { productId }, orderBy: { id: 'desc' }, include: { user: true } });
    const count = reviews.length;
    const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return res.json({
      summary: { average, count },
      reviews: reviews.map((r) => ({
        id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt,
        userId: r.userId, userName: r.user ? r.user.fullName : 'Người dùng',
      })),
    });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [AUTH] Gửi/cập nhật đánh giá. Mỗi user 1 review/sản phẩm; shop không review hàng của mình.
app.post('/api/products/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const rating = Number(req.body.rating);
    const comment = req.body.comment ? String(req.body.comment).trim() : null;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Số sao phải từ 1 đến 5' });

    const product = await prisma.product.findUnique({ where: { id: productId }, include: { shop: true } });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (product.shop && product.shop.userId === req.auth.userId) {
      return res.status(403).json({ message: 'Bạn không thể tự đánh giá sản phẩm của mình' });
    }

    const now = new Date().toISOString();
    const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId: req.auth.userId } } });
    if (existing) {
      await prisma.review.update({ where: { id: existing.id }, data: { rating, comment, updatedAt: now } });
      return res.json({ message: 'Đã cập nhật đánh giá của bạn' });
    }

    await prisma.review.create({ data: { productId, userId: req.auth.userId, rating, comment, createdAt: now, updatedAt: now } });
    // Thông báo cho shop khi có đánh giá mới
    if (product.shopId && product.shop) {
      await createNotification(product.shop.userId, 'new_review', 'Có đánh giá mới',
        `Sản phẩm "${product.name}" vừa nhận ${rating}★`, { productId });
    }
    return res.status(201).json({ message: 'Đã gửi đánh giá' });
  } catch (error) { console.error('REVIEW_CREATE_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [PUBLIC] Thông tin 1 shop (đã duyệt) để hiển thị trang cửa hàng
app.get('/api/shops/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop || shop.status !== 'approved') return res.status(404).json({ message: 'Không tìm thấy shop' });
    return res.json({ shop: { id: shop.id, shopName: shop.shopName, address: shop.address, phone: shop.phone, description: shop.description } });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [SHOP] Đăng sản phẩm mới (kèm ảnh). Shop -> chờ duyệt; Admin -> tự duyệt luôn (hàng Kira).
app.post('/api/products', authMiddleware, requireRole('shop', 'admin'), uploadProduct.single('image'), async (req, res) => {
  try {
    const actor = req.user; // từ requireRole
    const name = String(req.body.name || '').trim();
    const categoryId = Number(req.body.categoryId);
    const price = req.body.price !== undefined && req.body.price !== '' ? Number(req.body.price) : null;
    const clothType = req.body.clothType ? String(req.body.clothType) : null;
    const description = req.body.description ? String(req.body.description).trim() : null;

    if (!name || !categoryId) return res.status(400).json({ message: 'Cần nhập tên sản phẩm và chọn danh mục' });
    if (clothType && !['upper', 'lower', 'overall'].includes(clothType)) return res.status(400).json({ message: 'Loại trang phục không hợp lệ' });
    if (!req.file) return res.status(400).json({ message: 'Thiếu ảnh sản phẩm' });

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(400).json({ message: 'Danh mục không tồn tại' });

    let shopId = null;
    if (actor.role === 'shop') {
      const shop = await prisma.shop.findUnique({ where: { userId: actor.id } });
      if (!shop || shop.status !== 'approved') return res.status(403).json({ message: 'Shop của bạn chưa được duyệt' });
      shopId = shop.id;
    }

    const now = new Date().toISOString();
    const imageUrl = `/static/images/products/${req.file.filename}`;
    const isAdmin = actor.role === 'admin';

    const product = await prisma.product.create({
      data: {
        categoryId, shopId, name, description, price, clothType, imageUrl,
        isActive: 1,
        isApproved: isAdmin ? 1 : 0,   // admin tạo thì duyệt luôn
        tryOnEnabled: 1,
        creditAwarded: 0,
        createdAt: now, updatedAt: now,
      },
    });

    if (!isAdmin) {
      await notifyAdmins('product_pending', 'Sản phẩm mới chờ duyệt', `${name} đang chờ bạn duyệt`, { productId: product.id });
    }
    return res.status(201).json({
      message: isAdmin ? 'Đã tạo sản phẩm (hàng Kira)' : 'Đã gửi sản phẩm, chờ admin duyệt',
      product,
    });
  } catch (error) { console.error('PRODUCT_CREATE_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [SHOP/ADMIN] Sản phẩm của tôi (mọi trạng thái)
app.get('/api/shop/products', authMiddleware, requireRole('shop', 'admin'), async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'shop') {
      const shop = await prisma.shop.findUnique({ where: { userId: req.user.id } });
      if (!shop) return res.json({ products: [] });
      where = { shopId: shop.id };
    } else {
      where = { shopId: null }; // admin: hàng Kira chính hãng
    }
    const products = await prisma.product.findMany({ where, orderBy: { id: 'desc' }, include: { category: true, shop: true } });
    return res.json({ products: products.map((p) => formatProduct(req, p)) });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [SHOP/ADMIN] Xóa sản phẩm. Shop chỉ xóa được sản phẩm của mình; admin xóa được hàng Kira (shopId null).
app.delete('/api/products/:id', authMiddleware, requireRole('shop', 'admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    // Kiểm tra quyền sở hữu
    if (req.user.role === 'shop') {
      const shop = await prisma.shop.findUnique({ where: { userId: req.user.id } });
      if (!shop || product.shopId !== shop.id) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm này' });
      }
    } else {
      // admin chỉ xóa hàng Kira (shopId null) qua màn của mình; sản phẩm của shop thì dùng "từ chối"
      if (product.shopId !== null) {
        return res.status(403).json({ message: 'Sản phẩm thuộc shop — dùng chức năng từ chối thay vì xóa' });
      }
    }

    // Xóa file ảnh trong public/static/images/products nếu có
    if (product.imageUrl && product.imageUrl.startsWith('/static/images/products/')) {
      const filePath = path.join(staticDir, product.imageUrl.replace('/static/', ''));
      fs.unlink(filePath, () => {});
    }

    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Đã xóa sản phẩm' });
  } catch (error) { console.error('PRODUCT_DELETE_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [ADMIN] Danh sách sản phẩm theo trạng thái ?status=pending|approved|rejected
app.get('/admin/products', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : 'pending';
    let where = {};
    if (status === 'pending') where = { isApproved: 0, isActive: 1 };
    else if (status === 'approved') where = { isApproved: 1 };
    else if (status === 'rejected') where = { isApproved: 0, isActive: 0 };
    const products = await prisma.product.findMany({ where, orderBy: { id: 'desc' }, include: { category: true, shop: true } });
    return res.json({ products: products.map((p) => formatProduct(req, p)) });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [ADMIN] Duyệt sản phẩm -> hiện công khai + thưởng credit cho shop (1 lần duy nhất)
app.post('/admin/products/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const now = new Date().toISOString();
    let awarded = false;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { isApproved: 1, isActive: 1, updatedAt: now } });
      if (product.shopId && !product.creditAwarded) {
        const shop = await tx.shop.findUnique({ where: { id: product.shopId } });
        if (shop) {
          await tx.user.update({ where: { id: shop.userId }, data: { credits: { increment: CREDIT_REWARD_PER_PRODUCT } } });
          await tx.product.update({ where: { id }, data: { creditAwarded: 1 } });
          awarded = true;
        }
      }
    });

    if (product.shopId) {
      const ownerShop = await prisma.shop.findUnique({ where: { id: product.shopId } });
      if (ownerShop) {
        await createNotification(ownerShop.userId, 'product_approved', 'Sản phẩm đã được duyệt',
          awarded ? `"${product.name}" đã lên sàn. Bạn nhận +${CREDIT_REWARD_PER_PRODUCT} credit!` : `"${product.name}" đã được duyệt.`,
          { productId: product.id });
      }
    }
    return res.json({ message: awarded ? `Đã duyệt sản phẩm. +${CREDIT_REWARD_PER_PRODUCT} credit cho shop.` : 'Đã duyệt sản phẩm.' });
  } catch (error) { console.error('PRODUCT_APPROVE_ERROR:', error); return res.status(500).json({ message: 'Lỗi server' }); }
});

// [ADMIN] Từ chối sản phẩm -> ẩn đi (không thưởng credit)
app.post('/admin/products/:id/reject', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    await prisma.product.update({ where: { id }, data: { isApproved: 0, isActive: 0, updatedAt: new Date().toISOString() } });
    if (product.shopId) {
      const ownerShop = await prisma.shop.findUnique({ where: { id: product.shopId } });
      if (ownerShop) {
        await createNotification(ownerShop.userId, 'product_rejected', 'Sản phẩm bị từ chối',
          `"${product.name}" chưa được duyệt. Vui lòng kiểm tra lại.`, { productId: product.id });
      }
    }
    return res.json({ message: 'Đã từ chối sản phẩm' });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// ============================================================
// ================== PHASE 5: THÔNG BÁO ======================
// ============================================================

// [AUTH] Danh sách thông báo của tôi + số chưa đọc
app.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const items = await prisma.notification.findMany({ where: { userId: req.auth.userId }, orderBy: { id: 'desc' }, take: 50 });
    const unreadCount = await prisma.notification.count({ where: { userId: req.auth.userId, isRead: 0 } });
    return res.json({
      unreadCount,
      notifications: items.map((n) => ({
        id: n.id, type: n.type, title: n.title, body: n.body,
        data: n.data ? JSON.parse(n.data) : null, isRead: n.isRead, createdAt: n.createdAt,
      })),
    });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [AUTH] Đánh dấu đã đọc tất cả
app.post('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.auth.userId, isRead: 0 }, data: { isRead: 1 } });
    return res.json({ message: 'ok' });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

// [AUTH] Đánh dấu đã đọc 1 thông báo
app.post('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.notification.updateMany({ where: { id, userId: req.auth.userId }, data: { isRead: 1 } });
    return res.json({ message: 'ok' });
  } catch (error) { return res.status(500).json({ message: 'Lỗi server' }); }
});

app.listen(PORT, '0.0.0.0', () => { console.log(`Kira Labs API running at http://0.0.0.0:${PORT}`); });