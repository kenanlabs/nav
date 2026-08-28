-- 移除网站收录（访客投稿）功能：删除 Site 提交者字段与 SystemSettings 开关/限额
ALTER TABLE "Site" DROP COLUMN IF EXISTS "submitter_contact";
ALTER TABLE "Site" DROP COLUMN IF EXISTS "submitter_ip";
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "enable_submission";
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "submission_max_per_day";
