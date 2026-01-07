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

  const [branding, setBranding] = useState<any>(null);

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

      // Fetch branding
      if (invData.meetings?.organization_id) {
        const { data: brandingData } = await supabase
          .from('organization_branding')
          .select('*')
          .eq('organization_id', invData.meetings.organization_id)
          .single();

        if (brandingData) {
          setBranding(brandingData);
        }
      }

      setInvitation(invData);
      setMeeting(invData.meetings);
      setIsLoading(false);

      // Check if already used
      if (invData.status === 'accepted') {
        return;
      }

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
    <div className="relative flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            {branding?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo_url}
                alt="Organization Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Video className="h-10 w-10 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">{meeting.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            You've been invited to join this session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="rounded-xl border bg-card/50 p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              {meeting.scheduled_time && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Scheduled Time</div>
                    <div className="text-muted-foreground">{new Date(meeting.scheduled_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                </div>
                <div>
                  <div className="font-medium text-foreground">Meeting Code</div>
                  <code className="text-muted-foreground font-mono">{meeting.meeting_slug}</code>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleJoinMeeting}
            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            size="lg"
            style={{
              backgroundColor: branding?.primary_color || undefined,
              borderRadius: branding?.button_style === 'square' ? '4px' : '99px' // Use pill shape by default for invite pages
            }}
          >
            Join Meeting
          </Button>

          {invitation.status === 'accepted' && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 bg-green-50 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Invitation accepted
            </div>
          )}
        </CardContent>
      </Card>

      {/* Powered By Footer */}
      <div className="fixed bottom-4 right-4 flex items-center gap-1.5 text-xs text-muted-foreground/50 opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-2 fill-mode-forwards delay-500" style={{ animationFillMode: 'forwards' }}>
        <span>Powered by</span>
        <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Swiftdash</span>
      </div>
    </div>
  );
}
