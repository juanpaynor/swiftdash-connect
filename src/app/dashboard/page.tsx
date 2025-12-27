'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Video as VideoIcon, Loader2, Calendar, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Meeting, User } from '@/lib/database.types';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MeetingCard } from '@/components/dashboard/meeting-card';

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    scheduled_time: '',
    password: '',
    enable_waiting_room: false,
  });

  useEffect(() => {
    fetchUserAndMeetings();
  }, []);

  const fetchUserAndMeetings = async () => {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/');
      return;
    }

    // Get user record with organization
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!userRecord) {
      return;
    }

    setUser(userRecord);

    // Fetch meetings from user's organization
    const { data: meetingsData, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('organization_id', userRecord.default_organization_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch meetings',
        variant: 'destructive',
      });
    } else {
      setMeetings(meetingsData || []);
    }

    setIsLoading(false);
  };

  const handleCreateMeeting = async () => {
    if (!newMeeting.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a meeting title',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.default_organization_id) {
      toast({
        title: 'Error',
        description: 'No organization found',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const supabase = createClient();

      // Generate a unique meeting slug (6 characters)
      const meetingSlug = Math.random().toString(36).substring(2, 8).toLowerCase();

      const meetingData = {
        title: newMeeting.title,
        organization_id: user.default_organization_id,
        host_id: user.id,
        meeting_slug: meetingSlug,
        scheduled_time: newMeeting.scheduled_time || null,
        password: newMeeting.password || null,
        waiting_room_enabled: newMeeting.enable_waiting_room,
        status: 'scheduled' as const,
      };

      const { data: createdMeeting, error } = await supabase
        .from('meetings')
        .insert(meetingData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Meeting "${newMeeting.title}" created successfully`,
      });

      setIsDialogOpen(false);
      setIsDialogOpen(false);
      setNewMeeting({ title: '', scheduled_time: '', password: '', enable_waiting_room: false });

      // Refresh meetings
      await fetchUserAndMeetings();

      // Redirect to meeting page
      router.push(`/meeting/${createdMeeting.id}`);
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create meeting',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = () => {
    if (!joinCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a meeting code',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/meeting/join-code?code=${joinCode}`);
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      const supabase = createClient();
      const meeting = meetings.find(m => m.id === meetingId);

      if (!meeting) return;

      // Check if user is the host
      if (meeting.host_id !== user?.id) {
        toast({
          title: 'Permission Denied',
          description: 'Only the host can end the meeting',
          variant: 'destructive',
        });
        return;
      }

      // Update meeting status to completed
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'completed' })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: 'Meeting Ended',
        description: 'The meeting has been ended successfully',
      });

      // Refresh meetings list
      fetchUserAndMeetings();
    } catch (error: any) {
      console.error('Error ending meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to end meeting',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (meeting: Meeting) => {
    if (meeting.status === 'live') {
      return <Badge className="bg-green-500">Live</Badge>;
    } else if (meeting.status === 'completed') {
      return <Badge variant="secondary">Ended</Badge>;
    } else {
      return <Badge variant="default">Scheduled</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted/40 pb-20">
      <Header />

      <main className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Personalized Header */}
        <DashboardHeader user={user} />

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all group text-left">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">New Meeting</div>
                  <div className="text-blue-100 text-sm opacity-90">Start instantly or schedule</div>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Meeting</DialogTitle>
                <DialogDescription>
                  Enter meeting details. You can start it now or schedule for later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Weekly Team Sync"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Schedule Time (Optional)</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={newMeeting.scheduled_time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_time: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to start the meeting immediately
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Result Password (Optional)</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="text"
                      placeholder="Set a meeting password"
                      className="pl-9"
                      value={newMeeting.password}
                      onChange={(e) => setNewMeeting({ ...newMeeting, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-base">Waiting Room</Label>
                    <div className="text-xs text-muted-foreground">
                      Participants must be admitted by host
                    </div>
                  </div>
                  <Switch
                    checked={newMeeting.enable_waiting_room}
                    onCheckedChange={(checked) => setNewMeeting({ ...newMeeting, enable_waiting_room: checked })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMeeting} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Meeting'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="md:col-span-2 relative">
            <div className="absolute inset-0 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50  flex items-center p-2 focus-within:ring-2 ring-primary/20 transition-all">
              <div className="p-3">
                <VideoIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Enter a code to join (e.g. ABC-123)"
                className="border-0 bg-transparent focus-visible:ring-0 text-base h-full placeholder:text-muted-foreground/50"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
              />
              <Button onClick={handleJoinByCode} variant="secondary" className="mr-1">
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Meeting List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-semibold tracking-tight">Recent Sessions</h2>
            {meetings.length > 0 && <Button variant="link" className="text-muted-foreground">View all</Button>}
          </div>

          {meetings.length > 0 ? (
            <div className="space-y-3">
              {meetings.map(meeting => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  isHost={meeting.host_id === user?.id}
                  onEndMeeting={handleEndMeeting}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card/30">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium">No meetings yet</h3>
              <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                Create your first meeting above to get started with your sessions.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
