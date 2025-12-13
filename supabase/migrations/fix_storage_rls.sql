-- Fix RLS policies for storage upload
-- Run this in Supabase SQL Editor

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Org members can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete logos" ON storage.objects;

-- Grant access to organization_members just in case
GRANT SELECT ON public.organization_members TO authenticated;

-- Recreate Insert Policy using split_part for reliability
CREATE POLICY "Org members can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' AND
  (
    -- Check if user is member of the organization (folder name)
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id::text = split_part(name, '/', 1)
      AND user_id = auth.uid()
    )
  )
);

-- Recreate Update Policy
CREATE POLICY "Org members can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id::text = split_part(name, '/', 1)
      AND user_id = auth.uid()
    )
  )
);

-- Add Delete Policy (missing before)
CREATE POLICY "Org members can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id::text = split_part(name, '/', 1)
      AND user_id = auth.uid()
    )
  )
);

-- Ensure public access is still there
DROP POLICY IF EXISTS "Public logo access" ON storage.objects;
CREATE POLICY "Public logo access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');
