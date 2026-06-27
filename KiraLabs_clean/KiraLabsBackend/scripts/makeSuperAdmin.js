// Nâng 1 tài khoản lên SUPER ADMIN (quyền cao nhất: cấp/thu quyền admin cho người khác).
// Cách dùng (chạy trong thư mục KiraLabsBackend):
//   node scripts/makeSuperAdmin.js cuongpt.1602@gmail.com
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const identifier = (process.argv[2] || '').trim();
  if (!identifier) {
    console.error('❌ Thiếu tham số.\n   Dùng: node scripts/makeSuperAdmin.js <email_hoặc_số_điện_thoại>');
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
    data: { role: 'admin', isSuperAdmin: 1, updatedAt: new Date().toISOString() },
  });

  console.log(`✓ Đã nâng SUPER ADMIN cho: ${updated.fullName} (id=${updated.id}, ${updated.email || updated.phoneNumber})`);
  console.log('   Tài khoản này giờ có thể cấp/thu quyền admin cho người khác.');
  console.log('   Lưu ý: cần ĐĂNG NHẬP LẠI trên app để nhận quyền mới.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
