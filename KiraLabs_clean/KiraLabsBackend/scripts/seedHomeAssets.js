// scripts/seedHomeAssets.js
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const backendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendRoot, '..');
const uiImagesDir = path.join(projectRoot, 'KiraLabsUI', 'src', 'assets', 'images');
const backendHomeImagesDir = path.join(
  backendRoot,
  'public',
  'static',
  'images',
  'home'
);

const now = () => new Date().toISOString();

const categories = [
  {
    label: 'CLOTHING',
    slug: 'clothing',
    fileName: 'cat_clothing.jpg',
    sortOrder: 1,
  },
  {
    label: 'DRESSES',
    slug: 'dresses',
    fileName: 'cat_dresses.jpg',
    sortOrder: 2,
  },
  {
    label: 'SPORTWEAR',
    slug: 'sportwear',
    fileName: 'cat_sportwear.jpg',
    sortOrder: 3,
  },
  {
    label: 'SHOES',
    slug: 'shoes',
    fileName: 'cat_shoes.jpg',
    sortOrder: 4,
  },
  {
    label: 'ACCESSORIES',
    slug: 'accessories',
    fileName: 'cat_accessories.jpg',
    sortOrder: 5,
  },
  {
    label: 'TRENDING NOW',
    slug: 'trending-now',
    fileName: 'cat_trending.jpg',
    sortOrder: 6,
  },
];

const banner = {
  title: 'YOU WILL LOVE THESE',
  subtitle: 'Check out your\nrecommendations',
  buttonText: 'EXPLORE',
  target: 'forYou',
  fileName: 'banner_promo.jpg',
  sortOrder: 1,
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyAsset(fileName) {
  const sourcePath = path.join(uiImagesDir, fileName);
  const targetPath = path.join(backendHomeImagesDir, fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Không tìm thấy ảnh nguồn: ${sourcePath}`);
  }

  fs.copyFileSync(sourcePath, targetPath);

  return `/static/images/home/${fileName}`;
}

async function main() {
  ensureDir(backendHomeImagesDir);

  for (const category of categories) {
    const imagePath = copyAsset(category.fileName);

    await prisma.homeCategory.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        label: category.label,
        imagePath,
        sortOrder: category.sortOrder,
        updatedAt: now(),
      },
      create: {
        label: category.label,
        slug: category.slug,
        imagePath,
        sortOrder: category.sortOrder,
        createdAt: now(),
        updatedAt: now(),
      },
    });
  }

  const bannerImagePath = copyAsset(banner.fileName);

  await prisma.homeBanner.deleteMany({});

  await prisma.homeBanner.create({
    data: {
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.buttonText,
      target: banner.target,
      imagePath: bannerImagePath,
      isActive: 1,
      sortOrder: banner.sortOrder,
      createdAt: now(),
      updatedAt: now(),
    },
  });

  console.log('Seed home assets thành công.');
  console.log(`Ảnh đã copy vào: ${backendHomeImagesDir}`);
  console.log('API test: http://localhost:3000/home-content');
}

main()
  .catch((error) => {
    console.error('SEED_HOME_ASSETS_ERROR:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
