-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "site_name" TEXT NOT NULL DEFAULT 'Conan Nav',
    "site_description" TEXT NOT NULL DEFAULT '简洁现代化的网址导航系统',
    "site_logo" TEXT,
    "favicon" TEXT,
    "page_size" INTEGER NOT NULL DEFAULT 20,
    "show_footer" BOOLEAN NOT NULL DEFAULT true,
    "footer_copyright" TEXT NOT NULL,
    "footer_links" JSONB NOT NULL DEFAULT '[]',
    "show_admin_link" BOOLEAN NOT NULL DEFAULT true,
    "show_icp" BOOLEAN NOT NULL DEFAULT false,
    "icp_number" TEXT,
    "icp_link" TEXT,
    "enable_visit_tracking" BOOLEAN NOT NULL DEFAULT true,
    "github_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Site_categoryId_idx" ON "Site"("categoryId");

-- CreateIndex
CREATE INDEX "Site_isPublished_idx" ON "Site"("isPublished");

-- CreateIndex
CREATE INDEX "Site_categoryId_isPublished_idx" ON "Site"("categoryId", "isPublished");

-- CreateIndex
CREATE INDEX "Site_order_idx" ON "Site"("order");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Visit_siteId_idx" ON "Visit"("siteId");

-- CreateIndex
CREATE INDEX "Visit_visitedAt_idx" ON "Visit"("visitedAt");

-- CreateIndex
CREATE INDEX "Visit_siteId_visitedAt_idx" ON "Visit"("siteId", "visitedAt");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
