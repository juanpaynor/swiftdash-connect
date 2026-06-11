import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/stream/token
 * Generate Stream user token for video and chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    // Extract meeting_id from body if available
    const { is_guest, user_id: guestId, name: guestName, meeting_id } = body;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('Stream API credentials missing');
      return NextResponse.json(
        { error: 'Stream configuration missing' },
        { status: 500 }
      );
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    // Helper to add user to channel if meeting_id is present
    const ensureChannelMember = async (userId: string) => {
      if (meeting_id) {
        try {
          const channel = serverClient.channel('messaging', meeting_id, {
            created_by_id: userId // Ensure the channel exists or is created
          });
          await channel.create();
          await channel.addMembers([userId]);
        } catch (e) {
          console.error('Error adding member to channel:', e);
        }
      }
    };

    // GUEST FLOW
    if (is_guest && guestId && guestName) {
      await ensureChannelMember(guestId);

      // Explicitly upsert the user with 'user' role to ensure publishing permissions
      await serverClient.upsertUser({
        id: guestId,
        name: guestName,
        role: 'user',
      });

      const token = serverClient.createToken(guestId);
      return NextResponse.json({
        token,
        userId: guestId,
        userName: guestName,
        apiKey,
      });
    }

    // AUTH FLOW
    const supabase = await createClient();
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
      .select('id, full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate token for user
    // Generate token for user
    await ensureChannelMember(userRecord.id);
    const token = serverClient.createToken(userRecord.id);

    return NextResponse.json({
      token,
      userId: userRecord.id,
      userName: userRecord.full_name || user.email,
      userImage: userRecord.avatar_url || undefined,
      apiKey,
    });
  } catch (error: any) {
    console.error('Error generating Stream token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}
