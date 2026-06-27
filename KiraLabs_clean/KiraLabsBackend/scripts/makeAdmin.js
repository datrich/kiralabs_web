// Nâng 1 tài khoản lên quyền admin.
// Cách dùng (chạy trong thư mục KiraLabsBackend):
//   node scripts/makeAdmin.js cuongpt.1602@gmail.com
//   node scripts/makeAdmin.js 0987654321
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const identifier = (process.argv[2] || '').trim();
  if (!identifier) {
    console.error('❌ Thiếu tham số.\n   Dùng: node scripts/makeAdmin.js <email_hoặc_số_điện_thoại>');
    process.exit(1);
  }

  const isEmail = identifier.includes('@');
  const where = isEmail ? { email: identifier.toLowerCase() } : { phoneNumber: identifier };
  const user = await prisma.user.findFirst({ where });

  if (!user) {
    console.error(`❌ Không tìm thấy tài khoản với: ${identifier}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin', updatedAt: new Date().toISOString() },
  });

  console.log(`✓ Đã nâng quyền ADMIN cho: ${updated.fullName} (id=${updated.id}, ${updated.email || updated.phoneNumber})`);
  console.log('   Lưu ý: tài khoản này cần ĐĂNG NHẬP LẠI trên app để token nhận role mới.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
