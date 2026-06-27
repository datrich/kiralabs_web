// scripts/seedProducts.js
// Seed bảng Category + 6 sản phẩm demo (hàng chính hãng Kira, shopId = null).
// Các sản phẩm này KHÔNG try-on được (tryOnEnabled = 0), chỉ để trưng bày như bạn yêu cầu.
// Chạy: node scripts/seedProducts.js
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const now = () => new Date().toISOString();

const backendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendRoot, '..');
const uiImagesDir = path.join(projectRoot, 'KiraLabsUI', 'src', 'assets', 'images');
const productImagesDir = path.join(backendRoot, 'public', 'static', 'images', 'products');

// Danh mục (slug khớp với HomeCategory để đồng bộ)
const categories = [
  { name: 'CLOTHING', slug: 'clothing' },
  { name: 'DRESSES', slug: 'dresses' },
  { name: 'SPORTWEAR', slug: 'sportwear' },
  { name: 'SHOES', slug: 'shoes' },
  { name: 'ACCESSORIES', slug: 'accessories' },
  { name: 'TRENDING NOW', slug: 'trending-now' },
];

// 6 sản phẩm demo, gắn với slug danh mục + file ảnh nguồn trong KiraLabsUI
const demoProducts = [
  { name: 'red flowing dress', categorySlug: 'dresses', price: 43, clothType: 'overall', file: 'cat_dresses.jpg', description: 'A statement red dress designed for a confident and elegant look.' },
  { name: 'red coat outfit', categorySlug: 'clothing', price: 43, clothType: 'upper', file: 'cat_clothing.jpg', description: 'A clean red coat look for casual styling.' },
  { name: 'dry sport top', categorySlug: 'sportwear', price: 39, clothType: 'upper', file: 'cat_sportwear.jpg', description: 'A sporty item for active daily wear.' },
  { name: 'cream couple outfit', categorySlug: 'trending-now', price: 55, clothType: 'overall', file: 'cat_trending.jpg', description: 'A trending street-style outfit with a soft color palette.' },
  { name: 'white sneaker', categorySlug: 'shoes', price: 68, clothType: 'lower', file: 'cat_shoes.jpg', description: 'A clean white sneaker product card.' },
  { name: 'gold necklace set', categorySlug: 'accessories', price: 24, clothType: 'upper', file: 'cat_accessories.jpg', description: 'A detailed accessories item for product browsing.' },
];

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function copyAsset(fileName) {
  const src = path.join(uiImagesDir, fileName);
  const dst = path.join(productImagesDir, fileName);
  if (!fs.existsSync(src)) throw new Error(`Không tìm thấy ảnh nguồn: ${src}`);
  fs.copyFileSync(src, dst);
  return `/static/images/products/${fileName}`;
}

async function main() {
  ensureDir(productImagesDir);

  // 1) Seed danh mục
  const slugToId = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, updatedAt: now() },
      create: { name: c.name, slug: c.slug, createdAt: now(), updatedAt: now() },
    });
    slugToId[c.slug] = cat.id;
  }
  console.log(`✓ Đã seed ${categories.length} danh mục.`);

  // 2) Seed sản phẩm demo (bỏ qua nếu đã tồn tại hàng Kira)
  const existing = await prisma.product.count({ where: { shopId: null } });
  if (existing > 0) {
    console.log(`ℹ️  Đã có ${existing} sản phẩm Kira chính hãng, bỏ qua bước seed sản phẩm.`);
  } else {
    for (const p of demoProducts) {
      const imageUrl = copyAsset(p.file);
      await prisma.product.create({
        data: {
          categoryId: slugToId[p.categorySlug],
          shopId: null,
          name: p.name,
          description: p.description,
          price: p.price,
          clothType: p.clothType,
          imageUrl,
          isActive: 1,
          isApproved: 1,
          tryOnEnabled: 0, // hàng demo: chỉ trưng bày, không try-on
          creditAwarded: 0,
          createdAt: now(),
          updatedAt: now(),
        },
      });
    }
    console.log(`✓ Đã seed ${demoProducts.length} sản phẩm demo (hàng Kira, không try-on).`);
  }

  console.log('Seed products xong. Test: http://localhost:3000/api/categories');
}

main()
  .catch((e) => { console.error('SEED_PRODUCTS_ERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
