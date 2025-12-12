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
    const { is_guest, user_id: guestId, name: guestName } = body;

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

    // GUEST FLOW
    if (is_guest && guestId && guestName) {
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
