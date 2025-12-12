import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/invitations/send
 * Send meeting invitation via email
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
      .select('*')
      .eq('id', user.id)
      .single();

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { meetingId, email, invitationType } = body;

    if (!meetingId || !email) {
      return NextResponse.json(
        { error: 'Meeting ID and email are required' },
        { status: 400 }
      );
    }

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user has permission (must be in same organization)
    if (meeting.organization_id !== userRecord.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate invitation token (24-hour expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create invitation record
    const { data: invitation, error: invError } = await supabase
      .from('meeting_invitations')
      .insert({
        meeting_id: meetingId,
        invited_by: user.id,
        email,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (invError) {
      console.error('Error creating invitation:', invError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Get organization details for branding
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', meeting.organization_id)
      .single();

    // Construct invitation link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const invitationLink = `${appUrl}/invite/${token}`;

    // Send email via Resend
    try {
      await resend.emails.send({
        from: 'SwiftDash <noreply@swiftdash.com>',
        to: email,
        subject: `You're invited to join: ${meeting.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5BC2E7;">Meeting Invitation</h2>
            <p>You've been invited by <strong>${userRecord.full_name || userRecord.email}</strong> to join a meeting.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${meeting.title}</h3>
              <p><strong>Organization:</strong> ${org?.name || 'SwiftDash'}</p>
              ${meeting.scheduled_time ? `<p><strong>Scheduled:</strong> ${new Date(meeting.scheduled_time).toLocaleString()}</p>` : ''}
              <p><strong>Meeting Code:</strong> <code style="background: #e0e0e0; padding: 4px 8px; border-radius: 4px;">${meeting.meeting_code}</code></p>
            </div>

            <p>Click the button below to join the meeting:</p>
            
            <a href="${invitationLink}" style="display: inline-block; background: #5BC2E7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              Join Meeting
            </a>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This invitation expires in 24 hours. If you can't use the button above, copy and paste this link into your browser:<br>
              <a href="${invitationLink}" style="color: #5BC2E7;">${invitationLink}</a>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails, invitation link still works
    }

    return NextResponse.json({
      success: true,
      invitation,
      link: invitationLink,
    });
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
