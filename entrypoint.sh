#!/bin/sh
set -e

echo "🔧 初始化数据库..."

# 检查是否存在迁移文件夹
if [ -d "/app/prisma/migrations" ] && [ "$(ls -A /app/prisma/migrations)" ]; then
  echo "📦 检测到迁移文件，执行 Prisma Migrate..."

  # 检查是否是首次初始化（通过 _prisma_migrations 表是否存在）
  MIGRATION_TABLE_EXISTS=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '_prisma_migrations'
      )
    \`
      .then(result => {
        const exists = result[0].exists;
        console.log(exists ? 'yes' : 'no');
        process.exit(0);
      })
      .catch(() => {
        console.log('no');
        process.exit(0);
      });
  " 2>/dev/null || echo "no")

  if [ "$MIGRATION_TABLE_EXISTS" = "no" ]; then
    echo "🆕 首次部署，检测数据库是否已有数据..."

    # 检查 Site 表是否存在（判断是否是已有数据的数据库）
    TABLE_EXISTS=$(node -e "
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      prisma.\$queryRaw\`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'Site'
        )
      \`
        .then(result => {
          const exists = result[0].exists;
          console.log(exists ? 'yes' : 'no');
          process.exit(0);
        })
        .catch(() => {
          console.log('no');
          process.exit(0);
        });
    " 2>/dev/null || echo "no")

    if [ "$TABLE_EXISTS" = "yes" ]; then
      echo "📊 检测到现有数据，同步数据库 schema..."
      # 先用 db push 同步 schema（添加新字段）
      npx prisma db push --skip-generate
      echo "📊 Schema 同步完成，进行基线化（baseline）..."
      # 标记所有迁移为已应用（因为数据库结构已经是最新）
      for migration_dir in /app/prisma/migrations/*/; do
        migration_name=$(basename "$migration_dir")
        echo "  标记迁移: $migration_name"
        npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
      done
      echo "✅ 基线化完成"
    else
      echo "🆕 新数据库，执行迁移..."
      npx prisma migrate deploy
    fi
  else
    echo "🔄 执行待处理的数据库迁移..."
    npx prisma migrate deploy
  fi
else
  echo "⚠️  未检测到迁移文件，使用 db push（开发模式）..."
  npx prisma db push --skip-generate
fi

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
