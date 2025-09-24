-- Create complaint_types table
CREATE TABLE IF NOT EXISTS "complaint_types" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "slaHours" INTEGER NOT NULL DEFAULT 48,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add complaintTypeId to complaints (nullable for compatibility)
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "complaintTypeId" INTEGER;

-- Create index and foreign key
CREATE INDEX IF NOT EXISTS "complaints_complaintTypeId_idx" ON "complaints" ("complaintTypeId");
ALTER TABLE "complaints"
  ADD CONSTRAINT IF NOT EXISTS "complaints_complaintTypeId_fkey"
  FOREIGN KEY ("complaintTypeId") REFERENCES "complaint_types"("id") ON DELETE SET NULL;

-- Backfill complaint_types from system_config entries (if present)
INSERT INTO "complaint_types" ("name", "description", "priority", "slaHours", "isActive")
SELECT DISTINCT
  COALESCE(NULLIF(TRIM((cfg.value::json->>'name')), ''), REPLACE(cfg.key, 'COMPLAINT_TYPE_', '')) AS name,
  NULLIF(TRIM((cfg.value::json->>'description')), '') AS description,
  COALESCE((cfg.value::json->>'priority')::"Priority", 'MEDIUM') AS priority,
  COALESCE(NULLIF((cfg.value::json->>'slaHours'), '')::INTEGER, 48) AS slaHours,
  COALESCE(cfg."isActive", TRUE) AS isActive
FROM "system_config" cfg
WHERE cfg."key" LIKE 'COMPLAINT_TYPE_%'
ON CONFLICT ("name") DO NOTHING;

-- Map existing complaints to complaintTypeId by matching name
UPDATE "complaints" c
SET "complaintTypeId" = ct.id
FROM "complaint_types" ct
WHERE c."complaintTypeId" IS NULL
  AND c."type" = ct."name";

-- Trigger to keep updatedAt in sync
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_complaint_types'
  ) THEN
    CREATE TRIGGER set_updated_at_complaint_types
    BEFORE UPDATE ON "complaint_types"
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
