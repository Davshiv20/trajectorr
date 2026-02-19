-- Migration: Add AI insight caching columns to processes table
-- Run this in your Supabase SQL Editor

ALTER TABLE processes
ADD COLUMN IF NOT EXISTS ai_insight TEXT,
ADD COLUMN IF NOT EXISTS ai_tag TEXT,
ADD COLUMN IF NOT EXISTS ai_insight_log_count INTEGER,
ADD COLUMN IF NOT EXISTS ai_insight_updated_at TIMESTAMPTZ;

-- Create an index for faster cache lookups
CREATE INDEX IF NOT EXISTS idx_processes_ai_insight_log_count 
ON processes(id, ai_insight_log_count);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'processes' 
  AND column_name LIKE 'ai_%';
