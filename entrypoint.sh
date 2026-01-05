#!/bin/sh
set -e

echo "🔧 初始化数据库..."

# 推送数据库 schema
npx prisma db push --skip-generate

# 检查是否已初始化（检查管理员用户是否存在）
echo "🔍 检查数据库是否已初始化..."
if node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.findFirst({ where: { role: 'ADMIN' } })
    .then(user => {
      if (user) {
        console.log('✅ 数据库已初始化，跳过 seed');
        process.exit(0);
      } else {
        console.log('🌱 数据库未初始化，开始 seed...');
        process.exit(1);
      }
    })
    .catch(() => process.exit(1));
"; then
  echo "✅ 跳过 seed"
else
  echo "🌱 执行 seed 脚本..."
  npx tsx prisma/seed.ts
fi

echo "🚀 启动应用..."
exec node server.js
