npm-- SystemSettings 新增关于页面：前台入口开关（默认开启）与 Markdown 内容
ALTER TABLE "SystemSettings" ADD COLUMN "enable_about" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemSettings" ADD COLUMN "about_content" TEXT;
