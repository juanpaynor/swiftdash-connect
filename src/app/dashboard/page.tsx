'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Video as VideoIcon, ArrowRight, Loader2, Calendar, Lock, Users, PhoneOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Meeting, User } from '@/lib/database.types';

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
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Start a New Meeting</CardTitle>
              <CardDescription>Create and launch a meeting instantly or schedule for later.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="h-auto p-6">
                    <PlusCircle className="mr-2 h-6 w-6" />
                    <span className="text-lg">New Meeting</span>
                  </Button>
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
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Join a Meeting</CardTitle>
              <CardDescription>Enter a meeting code to join an existing meeting.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Enter meeting code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                  className="uppercase"
                />
                <Button onClick={handleJoinByCode} size="lg">
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Your Meetings</CardTitle>
              <CardDescription>Recent and upcoming meetings in your organization.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {meetings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Meeting Code</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell>
                        <div className="font-medium">{meeting.title}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {meeting.meeting_slug}
                        </code>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(meeting.scheduled_time)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatTime(meeting.scheduled_time)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getStatusBadge(meeting)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {meeting.status === 'live' && meeting.host_id === user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEndMeeting(meeting.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <PhoneOff className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/meeting/${meeting.id}`}>
                            <Button
                              variant={meeting.status === 'live' ? 'default' : 'outline'}
                              size="sm"
                            >
                              {meeting.status === 'live' ? 'Join Now' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No meetings yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first meeting to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
