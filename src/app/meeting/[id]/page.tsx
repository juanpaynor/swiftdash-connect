'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  StreamCall,
  SpeakerLayout,
  CallControls,
  useCallStateHooks,
  ParticipantView,
  PaginatedGridLayout,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  PhoneOff,
  MessageSquare,
  Users,
  UserPlus,
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  Shield,
  UserCheck,
  UserX,
  LayoutGrid,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Meeting, User as UserType } from '@/lib/database.types';
import { BrandingProvider, useBranding } from '@/lib/branding/theme-provider';
import { ThemeInjector } from '@/components/branding/theme-injector';
import { MeetingChat } from '@/components/meeting/meeting-chat';
import { InviteMeetingModal } from '@/components/meeting/invite-meeting-modal';
import Link from 'next/link';

type MeetingLayout = 'speaker' | 'grid';

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [streamToken, setStreamToken] = useState<string>('');
  const [streamApiKey, setStreamApiKey] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [meetingId, setMeetingId] = useState<string>('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [layout, setLayout] = useState<MeetingLayout>('speaker');

  // Security State
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<any[]>([]);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setMeetingId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (meetingId) {
      initializeMeeting();
    }

    return () => {
      // Cleanup on unmount
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [meetingId]);

  // Guest State
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestId, setGuestId] = useState('');

  useEffect(() => {
    // Generate a random guest ID on mount if not present
    if (!guestId) {
      setGuestId(crypto.randomUUID());
    }
  }, []);

  const initializeMeeting = async (isGuestRetry = false) => {
    try {
      const supabase = createClient();
      let currentUser: UserType | { id: string; full_name: string; email?: string; avatar_url?: string } | null = null;
      let isGuest = false;

      // 1. Get authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Fetch full user profile
        const { data: userRecord } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        currentUser = userRecord;
      }

      // 2. If no auth user, Handle Guest Flow
      if (!currentUser) {
        if (!guestName) {
          setShowGuestDialog(true);
          setIsLoading(false);
          return;
        }
        isGuest = true;
        currentUser = {
          id: guestId,
          full_name: guestName,
          email: 'guest@anonymous',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=random`
        };
      }

      if (currentUser && !isGuest) setUser(currentUser as UserType);

      // 3. Get meeting details
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (meetingError || !meetingData) {
        toast({ title: 'Meeting Not Found', description: 'This meeting does not exist', variant: 'destructive' });
        router.push('/dashboard');
        return;
      }
      setMeeting(meetingData);

      // 4. Password Check
      // (Guests always check password if enabled)
      if (meetingData.password && (!isGuest && meetingData.host_id !== currentUser.id) && !isPasswordVerified) {
        if (isGuest || meetingData.host_id !== currentUser.id) {
          setShowPasswordDialog(true);
          setIsLoading(false);
          return;
        }
      }

      // 5. Waiting Room & Participant Registration
      // Skip waiting room logic update for host, only for participants
      if (meetingData.host_id !== currentUser.id) {

        let participant: any = null;

        if (isGuest) {
          // FOR GUESTS: Skip the SELECT query completely to avoid "column not found" cache errors.
          // We rely 100% on the RPC function to handle "Get or Create".

          const { data: rpcData, error: rpcError } = await supabase.rpc('join_meeting_v2', {
            p_meeting_id: meetingData.id,
            p_guest_id: currentUser.id,
            p_guest_name: currentUser.full_name,
            p_status: meetingData.waiting_room_enabled ? 'waiting' : 'admitted'
          });

          if (rpcError) throw rpcError;

          participant = {
            id: (rpcData as any)?.id,
            meeting_id: meetingData.id,
            guest_id: currentUser.id,
            guest_name: currentUser.full_name,
            role: 'participant',
            status: (rpcData as any)?.status || (meetingData.waiting_room_enabled ? 'waiting' : 'admitted'),
            joined_at: new Date().toISOString()
          };

        } else {
          // FOR AUTHENTICATED USERS: Use standard check-then-insert flow
          const { data: existingParticipant } = await supabase
            .from('meeting_participants')
            .select('*')
            .eq('meeting_id', meetingData.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (existingParticipant) {
            participant = existingParticipant;
          } else {
            const { data: newParticipant, error: joinError } = await supabase
              .from('meeting_participants')
              .insert({
                meeting_id: meetingData.id,
                user_id: currentUser.id,
                role: 'participant',
                status: meetingData.waiting_room_enabled ? 'waiting' : 'admitted',
                joined_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (joinError) throw joinError;
            participant = newParticipant;
          }
        }

        // Waiting Room Handling
        if (participant.status === 'waiting') {
          setIsInWaitingRoom(true);
          setIsLoading(false);

          // Subscribe to status changes
          supabase.channel(`participant_${participant.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meeting_participants', filter: `id=eq.${participant.id}` },
              (payload) => {
                if (payload.new.status === 'admitted') {
                  setIsInWaitingRoom(false);
                  setIsLoading(true);
                  initializeMeeting(true);
                } else if (payload.new.status === 'denied') {
                  router.push('/dashboard');
                  toast({ title: 'Access Denied', description: 'Host denied your request.', variant: 'destructive' });
                }
              }).subscribe();
          return;
        } else if (participant.status === 'denied') {
          router.push('/dashboard');
          return;
        }
      }

      // 6. Get Stream Token
      // Use Guest payload if needed
      const tokenPayload = isGuest
        ? { is_guest: true, user_id: currentUser.id, name: currentUser.full_name }
        : {};

      const tokenResponse = await fetch('/api/stream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenPayload),
      });

      const { token, apiKey } = await tokenResponse.json();

      if (!token) throw new Error('Failed to get token');

      setStreamToken(token);
      setStreamApiKey(apiKey);

      // 7. Initialize Stream Client
      const streamClient = new StreamVideoClient({
        apiKey,
        user: {
          id: currentUser.id,
          name: currentUser.full_name,
          image: currentUser.avatar_url,
          type: isGuest ? 'guest' : 'regular',
        } as any, // Cast to any to avoid strict type mismatch on 'type' property
        token,
      });

      setClient(streamClient);
      const streamCall = streamClient.call('default', meetingData.id);
      await streamCall.join({ create: true });
      setCall(streamCall);

      // Set Live Status if Host
      if (!isGuest && meetingData.host_id === currentUser.id && meetingData.status !== 'live') {
        await supabase.from('meetings').update({ status: 'live' }).eq('id', meetingData.id);
      }

      setIsLoading(false);

    } catch (error: any) {
      console.error('Error initializing meeting:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join meeting',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      const supabase = createClient();

      if (call) {
        // Get call stats before leaving
        const participants = call.state.participants.length;

        // Log usage to database
        if (meeting && user) {
          await supabase.from('stream_usage_logs').insert({
            organization_id: user.default_organization_id!, // Fixed: changed from organization_id
            meeting_id: meeting.id,
            participant_minutes: 0, // Placeholder
            peak_concurrent_participants: participants,
            recorded_at: new Date().toISOString(),
          });

        }

        await call.leave();
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error leaving meeting:', error);
      router.push('/dashboard');
    }
  };

  const handleEndMeeting = async () => {
    try {
      const supabase = createClient();

      if (!meeting || !user) return;

      // Only host can end meeting for everyone
      if (meeting.host_id !== user.id) {
        toast({
          title: 'Permission Denied',
          description: 'Only the host can end the meeting',
          variant: 'destructive',
        });
        return;
      }

      // Update meeting status to completed
      await supabase
        .from('meetings')
        .update({ status: 'completed' })
        .eq('id', meeting.id);

      // End the call for everyone
      if (call) {
        await call.endCall();
      }

      toast({
        title: 'Meeting Ended',
        description: 'The meeting has been ended for all participants',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to end meeting',
        variant: 'destructive',
      });
    }
  };

  const fetchWaitingParticipants = async (mId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('meeting_participants')
      .select('*, users(full_name, email)')
      .eq('meeting_id', mId)
      .eq('status', 'waiting');
    setWaitingParticipants(data || []);
  };

  const handleAdmit = async (participantId: string) => {
    const supabase = createClient();
    await supabase
      .from('meeting_participants')
      .update({ status: 'admitted' })
      .eq('id', participantId);
    toast({
      title: 'Participant Admitted',
      description: 'The participant has been admitted to the meeting.',
    });
  };

  const handleDeny = async (participantId: string) => {
    const supabase = createClient();
    await supabase
      .from('meeting_participants')
      .update({ status: 'denied' })
      .eq('id', participantId);
    toast({
      title: 'Participant Denied',
      description: 'The participant has been denied access to the meeting.',
      variant: 'destructive',
    });
  };

  const verifyPassword = async () => {
    if (!meeting) return;

    if (passwordInput === meeting.password) {
      setPasswordError('');
      setShowPasswordDialog(false);
      setIsLoading(true);
      initializeMeeting();
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const copyMeetingCode = () => {
    if (meeting?.meeting_slug) {
      navigator.clipboard.writeText(meeting.meeting_slug);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'Meeting code copied to clipboard',
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (showGuestDialog) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center">Join Meeting</CardTitle>
            <CardDescription className="text-center">
              Please enter your name to join as a guest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && guestName.trim() && initializeMeeting()}
                placeholder="Ex. John Doe"
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={() => initializeMeeting()}
              disabled={!guestName.trim()}
            >
              Continue
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              or <Link href="/login" className="underline hover:text-primary">Log In</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPasswordDialog) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center">Password Required</CardTitle>
            <CardDescription className="text-center">
              This meeting is password protected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Meeting Password</Label>
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <Button className="w-full" onClick={verifyPassword}>
              Join Meeting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInWaitingRoom) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <div className="text-center max-w-md">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary mb-6" />
          <h1 className="text-2xl font-bold mb-2">Waiting Room</h1>
          <p className="text-muted-foreground">
            Please wait, the meeting host will let you in soon.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Unable to Join Meeting</CardTitle>
            <CardDescription>Failed to initialize video call</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <BrandingProvider organizationId={user?.default_organization_id || undefined}>
      <ThemeInjector />
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <div className="h-dvh w-full bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-none p-3 sm:p-4 border-b flex items-center justify-between bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/dashboard">
                  <Button variant="outline" size="icon" onClick={handleLeaveMeeting} className="h-8 w-8 sm:h-10 sm:w-10">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-sm sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs">{meeting?.title}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {meeting?.meeting_slug && (
                      <button
                        onClick={copyMeetingCode}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Code: {meeting.meeting_slug}
                        {isCopied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Invite Button */}
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>

                {/* Host Controls: Waiting Room */}
                {meeting?.host_id === user?.id && meeting?.waiting_room_enabled && (
                  <Sheet open={isWaitingRoomOpen} onOpenChange={setIsWaitingRoomOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="relative h-8 sm:h-9">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Waiting Room</span>
                        {waitingParticipants.length > 0 && (
                          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                            {waitingParticipants.length}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>Waiting Room ({waitingParticipants.length})</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        {waitingParticipants.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center">No one is waiting.</p>
                        ) : (
                          waitingParticipants.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                {/* Using placeholder avatar if user data missing */}
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                  {p.users?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{p.users?.full_name || 'Unknown User'}</p>
                                  <p className="text-xs text-muted-foreground">{p.users?.email}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => handleAdmit(p.id)}>
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeny(p.id)}>
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

                {/* End Meeting Button (Host Only) */}
                {meeting?.host_id === user?.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEndMeeting}
                    className="gap-2 h-8 sm:h-9"
                  >
                    <PhoneOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">End</span>
                  </Button>
                )}
              </div>
            </header>

            {/* Video Area */}
            <main className="flex-1 relative overflow-hidden w-full h-full">
              {layout === 'speaker' ? (
                <SpeakerLayout participantsBarPosition="bottom" />
              ) : (
                <PaginatedGridLayout groupSize={12} />
              )}
            </main>

            {/* Call Controls */}
            <footer className="p-4 flex justify-center gap-4">
              {/* Layout Toggle */}
              <div className="bg-card/95 backdrop-blur-sm border rounded-full p-2 shadow-lg hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={() => setLayout(layout === 'speaker' ? 'grid' : 'speaker')}
                  title={layout === 'speaker' ? "Switch to Grid View" : "Switch to Speaker View"}
                >
                  <LayoutGrid className={`h-5 w-5 ${layout === 'grid' ? 'text-primary' : ''}`} />
                </Button>
              </div>

              <div className="bg-card/95 backdrop-blur-sm border rounded-full p-2 shadow-lg">
                <CallControls onLeave={handleLeaveMeeting} />
              </div>

              {/* Chat Button */}
              <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-12 w-12"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Meeting Chat</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    {streamToken && streamApiKey && user && (
                      <MeetingChat
                        meetingId={meeting?.id || ''}
                        userId={user.id}
                        userName={user.full_name || user.email}
                        userImage={user.avatar_url || undefined}
                        token={streamToken}
                        apiKey={streamApiKey}
                      />
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </footer>
          </div>
        </StreamCall>
      </StreamVideo>
      <InviteMeetingModal
        meetingId={meeting?.id || ''}
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
    </BrandingProvider>
  );
}
