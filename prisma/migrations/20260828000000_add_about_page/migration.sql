-- About 页面：全局开关与默认内容 + 工作区内容覆盖项（为空时回退全局）
ALTER TABLE "Workspace" ADD COLUMN "about_content" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN "enable_about_page" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SystemSettings" ADD COLUMN "about_content" TEXT;
