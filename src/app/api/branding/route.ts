import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/branding
 * Fetch organization branding settings
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's organization
  const { data: userRecord } = await supabase
    .from('users')
    .select('default_organization_id')
    .eq('id', user.id)
    .single();

  if (!userRecord?.default_organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  // Get organization branding
  const { data: branding, error } = await supabase
    .from('organization_branding')
    .select('*')
    .eq('organization_id', userRecord.default_organization_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(branding);
}

/**
 * PUT /api/branding
 * Update organization branding settings
 * Only organization owners can update branding
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's organization and role
  const { data: userRecord } = await supabase
    .from('users')
    .select('default_organization_id')
    .eq('id', user.id)
    .single();

  if (!userRecord?.default_organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  // Check if user is owner
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', userRecord.default_organization_id)
    .single();

  if (membership?.role !== 'owner') {
    return NextResponse.json(
      { error: 'Only organization owners can update branding' },
      { status: 403 }
    );
  }

  // Ensure branding record exists (auto-create if missing, similar to page logic)
  let { data: branding } = await supabase
    .from('organization_branding')
    .select('branding_enabled')
    .eq('organization_id', userRecord.default_organization_id)
    .single();

  if (!branding) {
    // Create if missing
    const { data: newBranding, error: createError } = await supabase
      .from('organization_branding')
      .insert({
        organization_id: userRecord.default_organization_id,
        branding_enabled: true
      })
      .select('branding_enabled')
      .single();

    if (!createError) {
      branding = newBranding;
    }
  }

  if (!branding?.branding_enabled) {
    return NextResponse.json(
      { error: 'Branding is not enabled for this organization' },
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json();
  const {
    primary_color,
    secondary_color,
    accent_color,
    logo_url,
    favicon_url,
    meeting_background_color,
    meeting_border_style,
    show_logo_on_tiles,
    button_style,
    font_heading,
    font_body,
  } = body;

  // Update branding
  const { data: updatedBranding, error: updateError } = await supabase
    .from('organization_branding')
    .update({
      primary_color,
      secondary_color,
      accent_color,
      logo_url,
      favicon_url,
      meeting_background_color,
      meeting_border_style,
      show_logo_on_tiles,
      button_style,
      font_heading,
      font_body,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', userRecord.default_organization_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedBranding);
}
