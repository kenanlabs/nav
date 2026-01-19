-- AlterTable
ALTER TABLE "Site" ADD COLUMN "submitter_contact" TEXT;
ALTER TABLE "Site" ADD COLUMN "submitter_ip" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_submitter_ip_idx" ON "Site"("submitter_ip");

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN "enable_submission" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemSettings" ADD COLUMN "submission_max_per_day" INTEGER NOT NULL DEFAULT 3;
