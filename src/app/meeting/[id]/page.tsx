'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  StreamCall,
  SpeakerLayout,
  useCallStateHooks,
  ParticipantView,
  PaginatedGridLayout,
  useCall,
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
  Copy,
  Check,
  Shield,
  UserCheck,
  UserX,
  LayoutGrid,
  PenTool,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { QualitySelector } from '@/components/meeting/quality-selector';
import { FreeformLayout } from '@/components/meeting/freeform-layout';
import { MeetingWhiteboard } from '@/components/meeting/whiteboard/meeting-whiteboard';
import { Meeting, User as UserType } from '@/lib/database.types';
import { BrandingProvider, useBranding } from '@/lib/branding/theme-provider';
import { ThemeInjector } from '@/components/branding/theme-injector';
import { MeetingChat } from '@/components/meeting/meeting-chat';
import { InviteMeetingModal } from '@/components/meeting/invite-meeting-modal';
import { BrandedLoader } from '@/components/ui/branded-loader';
import Link from 'next/link';
import { useMobileInteractions } from '@/hooks/use-mobile-interactions';
import { cn } from '@/lib/utils';

type MeetingLayout = 'speaker' | 'grid';

// Custom Meeting Controls Component
function MeetingControls({ onLeave, onToggleChat, isChatOpen }: { onLeave: () => void; onToggleChat: () => void; isChatOpen: boolean }) {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { camera, isMute: isCameraMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const call = useCall();

  const toggleCamera = async () => {
    if (camera) {
      await camera.toggle();
    }
  };

  const toggleMicrophone = async () => {
    if (microphone) {
      await microphone.toggle();
    }
  };

  const toggleScreenShare = async () => {
    if (call) {
      try {
        if (isScreenSharing) {
          await call.screenShare.disable();
          setIsScreenSharing(false);
        } else {
          await call.screenShare.enable();
          setIsScreenSharing(true);
        }
      } catch (error) {
        console.error('Screen share error:', error);
      }
    }
  };

  return (
    <>
      {/* Camera */}
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full h-11 w-11 sm:h-10 sm:w-10 text-white ${isCameraMuted ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-white/20'}`}
        onClick={toggleCamera}
        title={isCameraMuted ? 'Turn Camera On' : 'Turn Camera Off'}
      >
        {isCameraMuted ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
      </Button>

      {/* Microphone */}
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full h-11 w-11 sm:h-10 sm:w-10 text-white ${isMicMuted ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-white/20'}`}
        onClick={toggleMicrophone}
        title={isMicMuted ? 'Unmute' : 'Mute'}
      >
        {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      {/* Chat Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full h-11 w-11 sm:h-10 sm:w-10 text-white ${isChatOpen ? 'bg-primary hover:bg-primary/90' : 'hover:bg-white/20'}`}
        onClick={onToggleChat}
        title="Chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {/* Screen Share */}
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full h-11 w-11 sm:h-10 sm:w-10 text-white ${isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-white/20'}`}
        onClick={toggleScreenShare}
        title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
      >
        <ScreenShare className="h-5 w-5" />
      </Button>

      {/* Leave */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full h-11 w-11 sm:h-10 sm:w-10 text-white bg-red-500 hover:bg-red-600"
        onClick={onLeave}
        title="Leave Meeting"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </>
  );
}

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
  const [isFreeformMode, setIsFreeformMode] = useState(false);
  const [isWhiteboardMode, setIsWhiteboardMode] = useState(false);


  // Security State
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<any[]>([]);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);

  // Mobile Interactions
  const { isMobile, showControls, toggleControls, handleInteraction } = useMobileInteractions();

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
  const [branding, setBranding] = useState<any | null>(null);

  useEffect(() => {
    // Generate a random guest ID on mount if not present
    if (!guestId) {
      setGuestId(crypto.randomUUID());
    }
  }, []);

  // Dynamic Metadata (Favicon & Title)
  useEffect(() => {
    if (!meeting) return;

    // 1. Update Title
    const orgName = branding?.organization_id ? ` | ${branding.organization_id}` : ''; // Fallback if org name not avail, checking schema
    const baseTitle = meeting.title || "Meeting";
    document.title = `${baseTitle}${orgName}`;

    // 2. Update Favicon
    if (branding?.favicon_url || branding?.logo_url) {
      const iconUrl = branding.favicon_url || branding.logo_url;

      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = iconUrl;
    }

    // Cleanup
    return () => {
      document.title = "SwiftDash Connect"; // Reset to default
      // Optionally reset favicon, but standard one is hard to restore without knowing path. 
      // Leaving it is usually fine as it resets on navigation.
    };
  }, [meeting, branding]);

  const initializeMeeting = async (isGuestRetry = false) => {
    try {
      // Always set loading state when starting initialization
      setIsLoading(true);

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

      // Fetch organization branding
      const { data: brandingData } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', meetingData.organization_id)
        .single();

      if (brandingData) {
        setBranding(brandingData);
      }

      // 3.5 Check if meeting is ended
      if (meetingData.status === 'completed' || meetingData.status === 'cancelled') {
        setIsLoading(false);
        return;
      }

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

          // Successful Join! Close dialog.
          setShowGuestDialog(false);

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

      // Enforce 720p (HD) limit to prevent 4K usage and save costs
      try {
        // @ts-ignore - SDK types might not reflect that enable accepts constraints
        await streamCall.camera.enable({
          video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: 30 }
        });
        await streamCall.microphone.enable();
      } catch (e) {
        console.error('Error enabling devices:', e);
      }

      // Set Live Status if Host
      if (!isGuest && meetingData.host_id === currentUser.id && meetingData.status !== 'live') {
        await supabase.from('meetings').update({ status: 'live' }).eq('id', meetingData.id);
      }

      // Subscribe to meeting status changes (for all participants)
      supabase
        .channel(`meeting-status-${meetingData.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'meetings',
          filter: `id=eq.${meetingData.id}`
        }, (payload) => {
          if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
            toast({
              title: 'Meeting Ended',
              description: 'The host has ended the meeting',
            });
            // Give user a moment to read toast before redirect
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
        })
        .subscribe();

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

  if (meeting?.status === 'completed' || meeting?.status === 'cancelled') {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <PhoneOff className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Meeting Ended</CardTitle>
            <CardDescription>
              This meeting has been {meeting.status} by the host.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">Return to Dashboard</Button>
            </Link>
            <div className="mt-4 text-sm text-muted-foreground">
              Need to start a new meeting? <Link href="/dashboard" className="underline text-primary">Go to Dashboard</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showGuestDialog) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt="Organization logo"
                className="mx-auto h-16 object-contain mb-4"
              />
            ) : (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-8 w-8" style={{ color: branding?.primary_color || undefined }} />
              </div>
            )}
            <CardTitle className="text-center" style={{ color: branding?.primary_color || undefined }}>
              Join {meeting?.title || 'Meeting'}
            </CardTitle>
            <CardDescription className="text-center">
              {meeting?.organization_id && branding ?
                `Hosted by ${meeting.organization_id}` :
                'Please enter your name to join as a guest'
              }
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
              style={{
                backgroundColor: branding?.primary_color || undefined,
                borderRadius: branding?.button_style === 'square' ? '4px' : undefined,
              }}
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
          <BrandedLoader size="xl" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Waiting Room</h1>
          <p className="text-muted-foreground">
            <span style={{ color: branding?.primary_color }}>
              {branding?.organization_id || "The host"}
            </span> has been notified. Please wait to be admitted.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <BrandedLoader size="lg" className="mx-auto" text="Joining meeting..." />
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
          <div
            className="relative h-dvh w-full overflow-hidden group"
            style={{ backgroundColor: branding?.meeting_background_color || '#000000' }}
            onClick={toggleControls}
          >
            {/* Header - Floating Overlay */}
            <header
              className={cn(
                "absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent transition-all duration-300",
                isMobile
                  ? (showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0")
                  : "-translate-y-full group-hover:translate-y-0"
              )}
              onClick={(e) => { e.stopPropagation(); handleInteraction(); }}
            >
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" onClick={handleLeaveMeeting} className="h-10 w-10 text-white hover:bg-white/20">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-sm sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs">{meeting?.title}</h1>
                  <p className="text-xs text-white/70 hidden sm:block">
                    {meeting?.meeting_slug && (
                      <button
                        onClick={copyMeetingCode}
                        className="inline-flex items-center gap-1 hover:text-white transition-colors"
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
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 border-none shadow-md"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>

                {/* Host Controls: Waiting Room */}
                {meeting?.host_id === user?.id && meeting?.waiting_room_enabled && (
                  <Sheet open={isWaitingRoomOpen} onOpenChange={setIsWaitingRoomOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="relative h-8 sm:h-9 bg-black/40 text-white border-white/20 hover:bg-black/60 hover:text-white">
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
                                  {(p.guest_name || p.users?.full_name)?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{p.guest_name || p.users?.full_name || 'Unknown User'}</p>
                                  <p className="text-xs text-muted-foreground">{p.guest_name ? '(Guest)' : p.users?.email}</p>
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
                    className="gap-2 h-8 sm:h-9 shadow-md"
                  >
                    <PhoneOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">End</span>
                  </Button>
                )}
              </div>

              {/* Layout Toggle & Info */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={isFreeformMode ? "bg-primary/20 text-primary" : "text-white"}
                  onClick={() => {
                    const newState = !isFreeformMode;
                    setIsFreeformMode(newState);
                    if (newState) setIsWhiteboardMode(false);
                  }}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  {isFreeformMode ? 'Freeform' : 'Grid'}
                </Button>

                {/* Whiteboard Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={isWhiteboardMode ? "bg-primary/20 text-primary" : "text-white"}
                  onClick={() => {
                    const newState = !isWhiteboardMode;
                    setIsWhiteboardMode(newState);
                    if (newState) setIsFreeformMode(true); // Enable freeform to show whiteboard tile
                  }}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Whiteboard
                </Button>

                <div className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium">
                    {call?.state.participantCount || 0} online
                  </span>
                </div>
              </div>
            </header>

            {/* Video Area */}
            <main className="absolute inset-0 z-0">
              <style jsx global>{`
                /* Fix Stream SDK video tile styling */
                .str-video__participant-view {
                  border: ${branding?.meeting_border_style === 'none' ? '0' : branding?.meeting_border_style === 'bold' ? '2px' : '1px'} solid ${branding?.secondary_color || 'rgba(255, 255, 255, 0.15)'} !important;
                  border-radius: 8px !important;
                  overflow: hidden !important;
                  position: relative !important;
                }

                ${branding?.show_logo_on_tiles && branding?.logo_url ? `
                .str-video__participant-view::after {
                  content: '';
                  position: absolute;
                  bottom: 8px;
                  right: 8px;
                  width: 48px;
                  height: 48px;
                  background-image: url('${branding.logo_url}');
                  background-size: contain;
                  background-repeat: no-repeat;
                  background-position: center;
                  opacity: 0.7;
                  z-index: 10;
                  pointer-events: none;
                }
                ` : ''}

                .str-video__participants-grid,
                .str-video__paginated-grid-layout {
                  width: 100% !important;
                  height: 100% !important;
                  padding: 1rem !important;
                  gap: 0.75rem !important;
                }

                .str-video__speaker-layout {
                  width: 100% !important;
                  height: 100% !important;
                }

                .str-video__speaker-layout__wrapper {
                  width: 100% !important;
                  height: 100% !important;
                }

                .str-video__participants-bar {
                  padding: 1rem !important;
                  gap: 0.5rem !important;
                }
              `}</style>
              {/* Video Grid */}
              <div className="relative h-full w-full p-4 flex items-center justify-center">
                {isFreeformMode ? (
                  <FreeformLayout
                    branding={branding}
                    meetingId={meetingId || meeting?.id || ''}
                    isWhiteboardOpen={isWhiteboardMode}
                  />
                ) : (
                  layout === 'speaker' ? (
                    <SpeakerLayout participantsBarPosition="bottom" />
                  ) : (
                    <PaginatedGridLayout />
                  )
                )}
              </div>

            </main>

            {/* Call Controls - Floating Footer */}
            <footer
              className={cn(
                "absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex justify-center gap-4 transition-all duration-300 pb-safe",
                isMobile
                  ? (showControls ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0")
                  : "translate-y-full group-hover:translate-y-0"
              )}
              onClick={(e) => { e.stopPropagation(); handleInteraction(); }}
            >
              {/* Layout Toggle */}
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 shadow-2xl">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 text-white hover:bg-white/20"
                  onClick={() => setLayout(layout === 'speaker' ? 'grid' : 'speaker')}
                  title={layout === 'speaker' ? "Switch to Grid View" : "Switch to Speaker View"}
                >
                  <LayoutGrid className={`h-5 w-5 ${layout === 'grid' ? 'text-blue-400' : ''}`} />
                </Button>
              </div>

              {/* Main Controls */}
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 shadow-2xl flex gap-2">
                <MeetingControls
                  onLeave={handleLeaveMeeting}
                  onToggleChat={() => setIsChatOpen(true)}
                  isChatOpen={isChatOpen}
                /></div>

              <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
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
