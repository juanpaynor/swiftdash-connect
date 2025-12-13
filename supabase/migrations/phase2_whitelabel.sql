-- Phase 2 Migration: Add Whitelabel Branding Columns
-- Run this in Supabase SQL Editor

-- Add new columns to organization_branding table
ALTER TABLE organization_branding 
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS meeting_background_color TEXT DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS meeting_border_style TEXT DEFAULT 'subtle',
  ADD COLUMN IF NOT EXISTS show_logo_on_tiles BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS branding_enabled BOOLEAN DEFAULT true;

-- Add constraints
ALTER TABLE organization_branding 
  ADD CONSTRAINT meeting_border_style_check 
    CHECK (meeting_border_style IN ('none', 'subtle', 'bold'));

ALTER TABLE organization_branding 
  ADD CONSTRAINT button_style_check 
    CHECK (button_style IN ('rounded', 'square'));

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for logo upload
CREATE POLICY IF NOT EXISTS "Org members can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' AND
  auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY IF NOT EXISTS "Org members can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
 bucket_id = 'organization-logos' AND
  auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY IF NOT EXISTS "Public logo access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');
