-- AlterTable
DO $$
BEGIN
    -- 检查列是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Site' AND column_name = 'submitter_contact'
    ) THEN
        ALTER TABLE "Site" ADD COLUMN "submitter_contact" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Site' AND column_name = 'submitter_ip'
    ) THEN
        ALTER TABLE "Site" ADD COLUMN "submitter_ip" TEXT;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "site_submitter_ip_idx" ON "Site"("submitter_ip");

-- AlterTable
DO $$
BEGIN
    -- 检查列是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'SystemSettings' AND column_name = 'enable_submission'
    ) THEN
        ALTER TABLE "SystemSettings" ADD COLUMN "enable_submission" BOOLEAN NOT NULL DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'SystemSettings' AND column_name = 'submission_max_per_day'
    ) THEN
        ALTER TABLE "SystemSettings" ADD COLUMN "submission_max_per_day" INTEGER NOT NULL DEFAULT 3;
    END IF;
END $$;
