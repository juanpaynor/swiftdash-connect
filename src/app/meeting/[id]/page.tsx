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

  const initializeMeeting = async () => {
    try {
      const supabase = createClient();

      // Get authenticated user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/');
        return;
      }

      // Get user record
      const { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!userRecord) {
        throw new Error('User not found');
      }

      setUser(userRecord);

      // Get meeting details
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (meetingError || !meetingData) {
        toast({
          title: 'Meeting Not Found',
          description: 'This meeting does not exist',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      setMeeting(meetingData);

      // 1. Password Check
      if (meetingData.password && meetingData.host_id !== userRecord.id && !isPasswordVerified) {
        setShowPasswordDialog(true);
        setIsLoading(false);
        return;
      }

      // 2. Waiting Room Logic
      if (meetingData.waiting_room_enabled && meetingData.host_id !== userRecord.id) {
        // Check if user is already a participant
        let { data: participant } = await supabase
          .from('meeting_participants')
          .select('*')
          .eq('meeting_id', meetingData.id)
          .eq('user_id', userRecord.id)
          .maybeSingle();

        if (!participant) {
          // Create as waiting
          const { data: newParticipant, error: joinError } = await supabase
            .from('meeting_participants')
            .insert({
              meeting_id: meetingData.id,
              user_id: userRecord.id,
              role: 'participant',
              status: 'waiting',
              joined_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (joinError) throw joinError;
          participant = newParticipant;
        }

        if (participant.status === 'waiting') {
          setIsInWaitingRoom(true);
          setIsLoading(false);

          // Subscribe to changes for this participant
          const channel = supabase
            .channel(`participant_${participant.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'meeting_participants',
                filter: `id=eq.${participant.id}`,
              },
              (payload) => {
                if (payload.new.status === 'admitted') {
                  setIsInWaitingRoom(false);
                  setIsLoading(true);
                  initializeMeeting(); // Retry join
                } else if (payload.new.status === 'denied') {
                  router.push('/dashboard');
                  toast({
                    title: 'Access Denied',
                    description: 'The host has denied your request to join.',
                    variant: 'destructive',
                  });
                }
              }
            )
            .subscribe();

          return;
        } else if (participant.status === 'denied') {
          router.push('/dashboard');
          return;
        }
        // If admitted, fall through to normal join
      }

      // 3. Host: Subscribe to Waiting Room
      if (meetingData.host_id === userRecord.id && meetingData.waiting_room_enabled) {
        fetchWaitingParticipants(meetingData.id);

        const channel = supabase
          .channel('waiting_room')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meeting_participants',
              filter: `meeting_id=eq.${meetingData.id}`,
            },
            () => {
              fetchWaitingParticipants(meetingData.id);
            }
          )
          .subscribe();
      }

      // Get Stream token
      const tokenResponse = await fetch('/api/stream/token', {
        method: 'POST',
      });

      const { token, userId, userName, apiKey } = await tokenResponse.json();

      // Store token and apiKey for chat
      setStreamToken(token);
      setStreamApiKey(apiKey);

      // Initialize Stream Video client
      const streamClient = new StreamVideoClient({
        apiKey,
        user: {
          id: userId,
          name: userName,
          image: userRecord.avatar_url,
        },
        token,
      });

      setClient(streamClient);

      // Create or join call
      const streamCall = streamClient.call('default', meetingData.id);

      // Join the call
      await streamCall.join({ create: true });

      setCall(streamCall);

      // Update meeting status to live if it's the host
      if (meetingData.host_id === userRecord.id && meetingData.status !== 'live') {
        await supabase
          .from('meetings')
          .update({ status: 'live' })
          .eq('id', meetingData.id);
      }

      // Add participant record (check if already exists)
      const { data: existingParticipant } = await supabase
        .from('meeting_participants')
        .select('id')
        .eq('meeting_id', meetingData.id)
        .eq('user_id', userRecord.id)
        .eq('user_id', userRecord.id)
        .maybeSingle();

      if (!existingParticipant) {
        await supabase.from('meeting_participants').insert({
          meeting_id: meetingData.id,
          user_id: userRecord.id,
          status: 'admitted', // Explicitly admit execution path
          joined_at: new Date().toISOString(),
        });
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error initializing meeting:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join meeting',
        variant: 'destructive',
      });
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
