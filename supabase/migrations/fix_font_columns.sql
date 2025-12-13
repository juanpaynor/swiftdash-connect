-- Fix: Add missing font columns to organization_branding
-- Run this in Supabase SQL Editor

ALTER TABLE organization_branding 
ADD COLUMN IF NOT EXISTS font_heading TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_body TEXT DEFAULT 'Inter';

-- Optional: Drop the old font_family column if you want to clean up, 
-- or keep it for backward compatibility. We'll leave it for now.
