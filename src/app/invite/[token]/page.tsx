'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Video, CheckCircle, XCircle } from 'lucide-react';

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      const supabase = createClient();

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get invitation details
      const { data: invData, error: invError } = await supabase
        .from('meeting_invitations')
        .select(`
          *,
          meetings (*)
        `)
        .eq('token', token)
        .single();

      if (invError || !invData) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (new Date(invData.expires_at) < new Date()) {
        setError('This invitation has expired');
        setIsLoading(false);
        return;
      }

      // Check if already used
      if (invData.status === 'accepted') {
        // Allow re-joining
        setInvitation(invData);
        setMeeting(invData.meetings);
        setIsLoading(false);
        return;
      }

      setInvitation(invData);
      setMeeting(invData.meetings);
      setIsLoading(false);

      // If user is authenticated, automatically mark as accepted
      if (user) {
        await supabase
          .from('meeting_invitations')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('token', token);
      }
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      setError('Failed to validate invitation');
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    const supabase = createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login with return URL
      toast({
        title: 'Login Required',
        description: 'Please login to join the meeting',
      });
      router.push(`/?redirect=/invite/${token}`);
      return;
    }

    // Mark invitation as accepted if not already
    if (invitation.status === 'pending') {
      await supabase
        .from('meeting_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('token', token);
    }

    // Redirect to meeting
    router.push(`/meeting/${meeting.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>Join this meeting to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">{meeting.title}</h3>
            {meeting.scheduled_time && (
              <p className="mt-2 text-sm text-muted-foreground">
                Scheduled: {new Date(meeting.scheduled_time).toLocaleString()}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Meeting Code:</span>
              <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                {meeting.meeting_slug}
              </code>
            </div>
          </div>

          <Button onClick={handleJoinMeeting} className="w-full" size="lg">
            Join Meeting
          </Button>

          {invitation.status === 'accepted' && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Invitation accepted
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
