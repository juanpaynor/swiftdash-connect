'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Video } from 'lucide-react';

import { Suspense } from 'react';

function JoinMeetingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [meetingCode, setMeetingCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Get code from URL if present
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setMeetingCode(codeParam.toUpperCase());
    }
  }, [searchParams]);

  const handleJoinMeeting = async () => {
    if (!meetingCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a meeting code',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);

    try {
      const supabase = createClient();

      // Find meeting by code
      const { data: meeting, error } = await supabase
        .from('meetings')
        .select('id, status')
        .eq('meeting_slug', meetingCode.toLowerCase())
        .single();

      if (error || !meeting) {
        toast({
          title: 'Meeting Not Found',
          description: 'Invalid meeting code. Please check and try again.',
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }

      // Redirect to meeting
      router.push(`/meeting/${meeting.id}`);
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to join meeting',
        variant: 'destructive',
      });
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Join a Meeting</CardTitle>
          <CardDescription>
            Enter the meeting code to join an existing meeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
              className="text-center text-2xl font-mono uppercase tracking-wider"
              maxLength={6}
            />
          </div>
          <Button
            onClick={handleJoinMeeting}
            disabled={isJoining || meetingCode.length < 6}
            className="w-full"
            size="lg"
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Meeting'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinMeetingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <JoinMeetingContent />
    </Suspense>
  );
}
