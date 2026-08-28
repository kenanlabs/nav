# Conan Nav

A clean and modern link navigation system built with Next.js 15, Prisma, and shadcn/ui.

[![GitHub stars](https://img.shields.io/github/stars/kenanlabs/nav?style=social)](https://github.com/kenanlabs/nav/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/kenanlabs/nav?style=social)](https://github.com/kenanlabs/nav/network/members)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Languages**: [简体中文](./README.zh-CN.md)

## ✨ Features

### Frontend
- 📂 **Category Navigation** - shadcn/ui Tabs style, sites organized by category
- 🔍 Real-time Search - millisecond response, no page reload
- 📱 Responsive Design - perfectly adapted for mobile
- 🎨 Clean & Elegant - strictly follows shadcn/ui design guidelines
- 🖼️ Smart Icons - auto-fetches site favicons, falls back to the first letter on failure
- 🌓 Dark Mode - one-click toggle (Light / Dark / System)
- 📜 **Daily Poetry** - fetches a poem of the day with elegant vertical layout

### Admin Dashboard
- 📊 Statistics - visit frequency charts, site rankings
- 🌐 Site Management - CRUD, publish status, icon display, **health checks**
- 📁 Category Management - custom categories and sorting
- 🗂️ **Multi-Workspace** - bind domains per workspace and route subdomains to dedicated content, falling back to the default workspace
- 📦 **Data Management** - import/export bookmarks, supports JSON and Chrome bookmark formats
  - JSON format: complete data backup (description, ordering, publish status, and all fields)
  - Full backup: includes workspace structures and domain bindings for site migration
  - Chrome bookmarks: browser-compatible format (name, URL, and icon only)
- 👤 Admin System - single-admin design, edit profile from the sidebar avatar
- ⚙️ System Settings - site name, logo, favicon, GitHub link, ICP filing, etc.
- 📈 Visit Tracking - optional site visit statistics

### Technical Highlights
- **Single-admin architecture** - no complex user permission system needed
- **Dynamic configuration** - modify site settings in real time from the dashboard
- **Pagination** - all list pages support pagination
- **Type safety** - full TypeScript typings, zero `any`
- **Production optimization** - unified logging, silent in production
- **Data visualization** - visit frequency charts with Recharts
- **Performance** - database index optimization, client-side real-time search (< 10ms response)
- **Smart icons** - user config > smart favicon > first-letter icon (graceful degradation)
- **ICP filing support** - optional ICP filing number and link in the frontend footer
- **Subdomain workspace routing** - exact domain matching with isolated content and per-workspace branding overrides
- **shadcn/ui best practices** - complete composition patterns (Card + CardHeader + CardTitle + CardAction)

## 📸 Screenshots

<table>
  <tr>
    <td><img src="screenshots/01-home.png" alt="Home" /></td>
    <td><img src="screenshots/02-search.png" alt="Search" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/03-dashboard.png" alt="Dashboard" /></td>
    <td><img src="screenshots/04-data.png" alt="Edit admin info" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/05-sites.png" alt="Site management" /></td>
    <td><img src="screenshots/06-category.png" alt="Category management" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/07-system.png" alt="System settings" /></td>
    <td><img src="screenshots/08-login.png" alt="Login page" /></td>
  </tr>
</table>

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Lucide Icons
- **Charts**: Recharts
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: Simple cookie-based auth (single admin)
- **Deployment**: Docker, GitHub Actions CI/CD

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env to configure the database connection

# 3. Initialize the database (auto-seeds basic data)
npx prisma generate
npm run db:push  # 4 categories + 4 sample sites

# For more sample data:
npm run db:seed:full  # 10 categories + 50+ curated sites

# 4. Start the dev server
npm run dev
```

🌐 **Access**:
- Frontend: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

**Default admin account**:
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Important**: change the default password immediately after the first login!

## 🗂️ Multi-Workspace & Subdomain Routing

A workspace is an independent content space: each workspace has its own categories, sites, and display config (title, description, logo, favicon), and can be bound to one or more domains. Visiting different subdomains renders the matching workspace; unmatched domains fall back to the default workspace.

```
Browser visits zh.example.com ──┐
Browser visits en.example.com ──┼──> Exact domain matching ──> Render the bound workspace
Browser visits nav.example.com ─┘   (unmatched/unpublished) ──> Render the default workspace
```

### Usage

1. Open **Workspaces** in the admin dashboard and create workspaces (e.g. Chinese site `zh`, English site `en`)
2. Bind a domain to each workspace (e.g. `zh.example.com`) and point its DNS to your server
3. Switch the workspace context in the top bar to manage categories and sites per workspace
4. Edit display fields per workspace in **System Settings → Basic Info** (empty values fall back to global)
5. Turn on the **publish switch** to go live; unpublished workspaces fall back to the default workspace even with bound domains

### Scope Reference

| Content | Scope |
|---------|-------|
| Categories, sites | Isolated per workspace |
| Title, description, logo, favicon | Per-workspace override, empty falls back to global |
| Category slug uniqueness | Unique within a workspace, reusable across workspaces |
| sitemap / robots | Output per visiting domain's workspace |
| Feature switches, footer, ICP filing, etc. | Globally shared |
| Visit statistics (dashboard) | Site-wide aggregate |

The workspace switcher in the admin top bar indicates the current page scope: switchable = content follows the workspace; disabled "Global" = site-wide, unaffected by the workspace switcher.

### Local Development

Without subdomains locally, dev mode supports query-parameter simulation:

```bash
# Preview the workspace with slug "zh"
# Visit http://localhost:3000/?__workspace=zh

# Or simulate a domain via the Host header
curl -H "Host: zh.example.com" http://localhost:3000/
```

Preview environments can enable the query parameter with `ENABLE_WORKSPACE_PREVIEW=true` (ignored in production, which matches by domain only).

### Data Persistence

Workspaces, categories, and sites all rely on a database for persistence. Without `DATABASE_URL` configured, the app runs in memory mode: data lives only in a single instance's memory — **on Serverless platforms (Vercel / Cloudflare Workers) instances do not share state and reset on cold start**, so newly created data disappears after a refresh or redeploy. Always configure PostgreSQL (e.g. Neon / Supabase / RDS) in production and run `npm run db:migrate:deploy`.

## 📦 Production Deployment

### Option 1: Docker (Recommended)

This project ships a complete Docker deployment setup with an optimized multi-stage build and a docker-compose configuration.

#### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/kenanlabs/nav.git
cd nav

# 2. Configure environment variables
cp .env.example .env
# Edit .env to set SESSION_SECRET (or NEXTAUTH_SECRET)
# DATABASE_URL is auto-generated for Docker deployments

# 3. Start the service (uses the image built by GitHub Actions)
docker compose up -d

# 4. View logs
docker compose logs -f nav
```

🌐 **Access** (depends on the `PORT` env var, default 3000):
- Local: `http://localhost:3000`
- Remote: `http://your-server-ip:3000` or `http://your-domain.com`
- Admin: `http://localhost:3000/admin` or `http://your-domain.com/admin`

#### Environment Variables (Docker)

```bash
# Core config (required)
SESSION_SECRET=your-session-secret-here # session signing key, falls back to NEXTAUTH_SECRET
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000 # use your real domain in production

# Docker config (optional, has defaults)
POSTGRES_USER=nav
POSTGRES_PASSWORD=FkyM5NhrsYHtmmKc
POSTGRES_DB=nav
POSTGRES_PORT=5432
PORT=3000
```

#### Common Commands

```bash
# Pull the latest image and restart
docker compose pull && docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f nav

# Stop the service
docker compose down

# Stop and remove data volumes (⚠️ deletes database data)
docker compose down -v
```

#### GitHub Actions CI/CD

Docker images are built automatically by GitHub Actions and pushed to the GitHub Container Registry:

- **Image**: `ghcr.io/kenanlabs/nav:latest`
- **Trigger**: Git tag push (format: `v*.*.*`)
- **Result**: pushes both `version` and `latest` tags

**Publishing a new release**:

```bash
# Create and push a git tag (triggers GitHub Actions)
git tag v1.0.0
git push origin v1.0.0
```

### Option 2: PM2 + Nginx

```bash
# 1. Clone the repo
git clone https://github.com/kenanlabs/nav.git
cd nav

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env to set DATABASE_URL and NEXTAUTH_SECRET

# 4. Initialize the database
npx prisma generate
npm run db:push

# 5. Build and start
npm run build
npm start

# Or manage with PM2
npm install -g pm2
pm2 start npm --name "nav" -- start
pm2 startup  # enable auto-start on boot
pm2 save
```

## ⚙️ Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string (**auto-generated for Docker**) | `postgresql://user:pass@localhost:5432/nav` | ❌ (Docker) / ✅ (local) |
| `SESSION_SECRET` | Session signing key (HMAC), falls back to `NEXTAUTH_SECRET` | random string (`openssl rand -base64 32`) | ✅ (one of the two) |
| `NEXTAUTH_SECRET` | Encryption key (also used as session signing fallback) | random string (`openssl rand -base64 32`) | ✅ |
| `NEXTAUTH_URL` | Full app URL | `http://localhost:3000` or `https://your-domain.com` | ✅ |

**Docker**: only `SESSION_SECRET` (or `NEXTAUTH_SECRET`) is required; other variables have defaults or are auto-generated.

**Local dev**: configure the full `DATABASE_URL` manually.

## 📁 Project Structure

```
.
├── app/                  # Next.js App Router
│   ├── (public)/         # Frontend pages
│   ├── admin/            # Admin dashboard
│   └── api/              # API routes
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   │   ├── jinrishici-card.tsx         # Daily poetry card
│   │   └── jinrishici-card-wrapper.tsx # Poetry card wrapper (animations)
│   ├── admin/           # Admin components
│   ├── poetry-toggle.tsx         # Poetry toggle button
│   └── theme-provider/  # Theme provider
├── hooks/
│   └── use-poetry-toggle.ts  # Poetry visibility state hook
├── lib/                 # Utilities and Server Actions
├── prisma/              # Database models and seed data
├── public/              # Static assets
└── screenshots/         # Project screenshots
```

## 🔄 Upgrade Guide

Versioned automatic database migrations are supported since **v0.0.8**.

### Upgrading from v0.0.8 (and later)

**Docker** (automatic):
```bash
docker compose pull && docker compose up -d
# entrypoint.sh runs database migrations automatically
# ✅ no manual steps needed
```

**npm**:
```bash
git pull && npm install && npm run db:migrate:deploy && npm start
```

---

## 🔧 FAQ

### What's the difference between `npx prisma generate` and `npm run db:push`?

- **`npx prisma generate`**: generates the Prisma Client (database access code); only needed when the schema changes
- **`npm run db:push`**: syncs the database schema + seeds initial data; needed on first install or when the schema changes

**Both steps are required on first install**.

### Why does the database connection fail?

1. Is PostgreSQL running?
2. Is `DATABASE_URL` in `.env` correct?
3. Are the database username and password correct?
4. Does the `nav` database exist?

### How do I reset the admin password?

**Method 1** (recommended): log into the dashboard → click the sidebar avatar → edit profile → change password

**Method 2**: delete the admin from the database, then re-initialize
```bash
# 1. Connect and delete the admin
psql -h localhost -U nav -d nav -c "DELETE FROM \"User\" WHERE email = 'admin@example.com';"

# 2. Re-initialize the database
npm run db:push
```

### Why doesn't the frontend update after I modify the database directly?

#### Data update flow

1. **Via the admin dashboard** (recommended)
   - Add/modify sites or categories in the dashboard
   - The frontend refreshes automatically within 10 seconds
   - ✅ **no service restart or rebuild needed**

2. **Direct database access**
   - Modify the database directly with SQL, Prisma Studio, etc.
   - The frontend will **not update immediately** (cache TTL is 10 seconds)
   - ⚠️ **wait for the cache to expire (up to 10s) or clear it manually**

#### Best practices

- ✅ **Prefer the admin dashboard** for all data operations
- ✅ Avoid direct database access (except bulk import or advanced operations)
- ✅ If you must touch the database, restart the service afterwards for immediate effect

### Why is there no user management in the system settings page?

Conan Nav uses a **single-admin architecture**. Admin profile editing is integrated into the sidebar avatar component, which is simpler and more intuitive.

### How do I back up the database?

**⚠️ Important**: back up the database before performing any database operations!

#### Docker

```bash
# 1. Stop the service
docker compose down

# 2. Back up the database (includes all data)
docker compose exec postgresql pg_dump -U nav nav > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Restart the service
docker compose up -d
```

#### npm

```bash
# 1. Back up the database
pg_dump -h localhost -U nav nav > backup_$(date +%Y%m%d_%H%M%S).sql

# Or back up the Docker data volume
docker run --rm -v nav_postgresql_data:/data -v $(pwd):/backup ubuntu tar czf /backup/backup_$(date +%Y%m%d_%H%M%S).tar.gz /data
```

#### How to restore a backup?

```bash
# Docker
docker compose exec postgresql psql -U nav nav < backup_20260121_143000.sql

# npm
psql -h localhost -U nav nav < backup_20260121_143000.sql
```

#### Backup strategy suggestions

1. **Scheduled automatic backups**: use a cron job for daily backups
2. **Offsite backups**: upload backups to cloud storage (S3/OSS)
3. **Backup verification**: periodically test that backups can be restored
4. **Backup retention**: keep at least 30 days of backups

#### Exporting data (without visit stats)

If you only need site and category data (no visit statistics), use the "Data Management" feature in the dashboard:

- Export as JSON: includes all sites, categories, and system settings
- Does NOT include: visit records, admin account

This is useful for data migration and partial recovery.

## 💡 Related Resources

- 📘 [Full documentation](https://deepwiki.com/kenanlabs/nav)
- 📬 [Issues](../../issues)
- 💬 [Discussions](../../discussions)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=kenanlabs/nav&type=date&legend=top-left)](https://www.star-history.com/#kenanlabs/nav&type=date&legend=top-left)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
