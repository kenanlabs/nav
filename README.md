# Conan Nav

一个简洁现代化的网址导航系统，基于 Next.js 15、Prisma 和 shadcn/ui 构建。

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)


## ✨ 特性

### 前台导航
- 📂 分类导航 - 按类别组织网站
- 🔍 实时搜索 - 毫秒级响应，无需页面跳转
- 📱 响应式设计 - 完美适配移动端
- 🎨 简洁优雅 - 严格遵循 shadcn/ui 设计规范
- 🖼️ 智能图标 - 自动获取网站图标，加载失败时显示首字母
- 🌓 暗黑模式 - 右上角一键切换

### 后台管理
- 📊 数据统计 - 访问频次图表、网站排行
- 🌐 网站管理 - 增删改查、发布状态、图标显示
- 📁 分类管理 - 自定义分类和排序
- 👤 管理员系统 - 单管理员设计，侧边栏头像直接编辑
- ⚙️ 系统设置 - 网站名称、Logo、Favicon、GitHub链接、ICP备案等
- 📈 访问追踪 - 可开启/关闭的网站访问统计

### 技术亮点
- **单管理员架构** - 无需复杂的用户权限系统
- **动态配置** - 后台实时修改网站设置
- **分页优化** - 所有列表页支持分页
- **类型安全** - 完整的 TypeScript 类型定义，零 any 类型
- **数据可视化** - 使用 Recharts 展示访问频次统计
- **性能优化** - 数据库索引优化，客户端实时搜索（< 10ms 响应）
- **智能图标** - 用户配置 > DuckDuckGo Favicon > 首字母图标（优雅降级）
- **ICP备案支持** - 前台底部可配置显示 ICP 备案号和链接

## 📸 截图预览

<table>
  <tr>
    <td><img src="screenshots/01-home.png" /></td>
    <td><img src="screenshots/02-search.png" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/03-dashboard.png" /></td>
    <td><img src="screenshots/04-editor.png" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/05-sites.png" /></td>
    <td><img src="screenshots/06-category.png" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/07-system.png" /></td>
    <td><img src="screenshots/08-login.png" /></td>
  </tr>
</table>


## 🛠️ 技术栈

- **前端**: Next.js 15 (App Router)、React 19、TypeScript
- **UI**: shadcn/ui、Tailwind CSS、Lucide Icons
- **图表**: Recharts
- **后端**: Next.js Server Actions、Prisma ORM
- **数据库**: PostgreSQL
- **认证**: 简单 Cookie 认证（单管理员）

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 3. 初始化数据库（会自动填充基础数据）
npx prisma generate
npm run db:push  # 4个分类+4个示例网站

# 如需更多示例数据：
npm run db:seed:full  # 10个分类+50+个精选网站

# 4. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看前台，
访问 [http://localhost:3000/admin](http://localhost:3000/admin) 查看后台。

**默认管理员账号**：
- 邮箱：`admin@example.com`
- 密码：`admin123`

⚠️ **重要**：首次登录后请立即修改默认密码！

## 📦 生产部署

### 方式一：使用 Docker（推荐）

本项目提供完整的 Docker 部署方案，包括优化的多阶段构建和 docker-compose 配置。

#### 快速开始

```bash
# 1. 克隆代码
git clone https://github.com/01wanwu/nav.git
cd nav

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 NEXTAUTH_SECRET
# Docker 部署时 DATABASE_URL 会自动生成

# 3. 启动服务（使用 GitHub Actions 构建的镜像）
docker compose up -d

# 4. 查看日志
docker compose logs -f nav
```

访问 [http://localhost:3000](http://localhost:3000) 查看前台，
访问 [http://localhost:3000/admin](http://localhost:3000/admin) 查看后台。

#### 环境变量（Docker 部署）

```bash
# 核心配置（必填）
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Docker 配置（可选，有默认值）
POSTGRES_USER=nav
POSTGRES_PASSWORD=FkyM5NhrsYHtmmKc
POSTGRES_DB=nav
POSTGRES_PORT=5232
PORT=3000
```

#### 常用命令

```bash
# 拉取最新镜像并重启
docker compose pull && docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f nav

# 停止服务
docker compose down

# 停止服务并删除数据卷（⚠️ 会删除数据库数据）
docker compose down -v
```

#### GitHub Actions CI/CD

本项目使用 GitHub Actions 自动构建 Docker 镜像，推送到 GitHub Container Registry：

- **镜像地址**: `ghcr.io/01wanwu/nav:latest`
- **触发条件**: Git tag 推送（格式：`v*.*.*`）
- **构建结果**: 同时推送 `version` 和 `latest` 标签

**发布新版本**：

```bash
# 创建并推送 git tag（触发 GitHub Actions）
git tag v1.0.0
git push origin v1.0.0
```

### 方式二：使用 PM2 + Nginx

```bash
# 1. 克隆代码
git clone https://github.com/01wanwu/nav.git
cd nav

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 DATABASE_URL 和 NEXTAUTH_SECRET

# 4. 初始化数据库
npx prisma generate
npm run db:push

# 5. 构建并启动
npm run build
npm start

# 或使用 PM2 管理
npm install -g pm2
pm2 start npm --name "nav" -- start
pm2 startup  # 设置开机自启
pm2 save
```

## ⚙️ 环境变量

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串（**Docker 部署时自动生成**） | `postgresql://user:pass@localhost:5432/nav` | ❌（Docker）/ ✅（本地） |
| `NEXTAUTH_SECRET` | 加密密钥 | 随机字符串（`openssl rand -base64 32`） | ✅ |
| `NEXTAUTH_URL` | 应用完整 URL | `http://localhost:3000` 或 `https://your-domain.com` | ✅ |

**Docker 部署**：只需配置 `NEXTAUTH_SECRET`，其他环境变量有默认值或自动生成。

**本地开发**：需要手动配置完整的 `DATABASE_URL`。

## 📁 项目结构

```
.
├── app/                  # Next.js App Router
│   ├── (public)/         # 前台页面
│   ├── admin/            # 后台管理
│   └── api/              # API 路由
├── components/           # React 组件
│   ├── ui/              # shadcn/ui 组件
│   ├── layout/          # 布局组件
│   └── admin/           # 后台组件
├── lib/                 # 工具函数和 Server Actions
├── prisma/              # 数据库模型和种子数据
├── public/              # 静态资源
└── screenshots/         # 项目截图
```

## 🔧 常见问题

### npx prisma generate 和 npm run db:push 的区别？

- **`npx prisma generate`**：生成 Prisma Client（数据库访问代码），只在 schema 变化时需要
- **`npm run db:push`**：同步数据库结构 + 填充初始数据，首次安装或 schema 变化时需要

**首次安装必须两步都做**。

### 为什么数据库连接失败？

1. PostgreSQL 服务是否启动
2. `.env` 文件中的 `DATABASE_URL` 是否正确
3. 数据库用户名和密码是否正确
4. 数据库 `nav` 是否已创建

### 如何重置管理员密码？

**方法 1**（推荐）：登录后台 → 点击侧边栏头像 → 编辑资料 → 修改密码

**方法 2**：连接数据库删除管理员后重新初始化
```bash
# 1. 连接数据库删除管理员
psql -h localhost -U nav -d nav -c "DELETE FROM \"User\" WHERE email = 'admin@example.com';"

# 2. 重新初始化数据库
npm run db:push
```

### 为什么直接修改数据库后前台不更新？

#### 数据更新流程

1. **后台管理界面操作**（推荐）
   - 在后台添加/修改网站或分类
   - 前台会在 10 秒内自动刷新
   - ✅ **无需重启服务或重新构建**

2. **直接操作数据库**
   - 使用 SQL、Prisma Studio 等工具直接修改数据库
   - 前台**不会立即更新**（缓存有效期 10 秒）
   - ⚠️ **需要等待缓存过期（最多 10 秒）或手动清除**

#### 最佳实践

- ✅ **优先使用后台管理界面**进行所有数据操作
- ✅ 避免直接操作数据库（除非进行批量导入或高级操作）
- ✅ 如果必须直接操作数据库，操作后重启服务以立即生效

### 系统管理页面为什么没有用户管理？

Conan Nav 采用**单管理员架构**，管理员信息的编辑已集成到侧边栏的头像组件中，设计更加简洁直观。

## 💡 相关资源

- 📘 [完整文档](https://deepwiki.com/01wanwu/nav)
- 📬 [问题反馈](../../issues)
- 💬 [讨论区](../../discussions)

## 📄 License

MIT

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
