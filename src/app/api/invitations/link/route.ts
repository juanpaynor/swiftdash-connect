import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/invitations/link
 * Generate shareable meeting link
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user record
    const { data: userRecord } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { meetingId } = body;

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('meeting_code, organization_id')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user has permission
    if (meeting.organization_id !== userRecord.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate shareable link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const link = `${appUrl}/meeting/join-code?code=${meeting.meeting_code}`;

    return NextResponse.json({
      success: true,
      link,
      meetingCode: meeting.meeting_code,
    });
  } catch (error: any) {
    console.error('Error generating link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate link' },
      { status: 500 }
    );
  }
}
