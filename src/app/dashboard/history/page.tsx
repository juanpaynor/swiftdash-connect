'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/client';
import { Meeting, User } from '@/lib/database.types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Clock, FileText, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SummaryModal } from '@/components/meeting/ai-companion/SummaryModal';

// Extend Meeting type to include optionally joined summary data
interface HistoryMeeting extends Meeting {
    meeting_summaries?: {
        id: string;
        key_points: string[] | null;
        action_items: any[] | null;
        decisions: string[] | null;
        full_transcript: string | null;
    } | null;
}

export default function HistoryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [meetings, setMeetings] = useState<HistoryMeeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Specific state for the Summary Modal
    const [selectedSummary, setSelectedSummary] = useState<any>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<HistoryMeeting | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const supabase = createClient();

        // 1. Get User
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            router.push('/');
            return;
        }

        // 2. Get User Profile for Organization ID
        const { data: userRecord } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (!userRecord) return;
        setUser(userRecord);

        // 3. Fetch Completed Meetings with Summaries
        const { data, error } = await supabase
            .from('meetings')
            .select('*, meeting_summaries(*)')
            .eq('organization_id', userRecord.default_organization_id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
            toast({
                title: 'Error',
                description: 'Failed to load meeting history.',
                variant: 'destructive',
            });
        } else {
            // Supabase returns array even for single relation if not 1:1 strictly enforced by types, 
            // but here we expect meeting_summaries to be an object or array depending on query. 
            // Since it's a 1:1 relation logic, it might come as array of 1 or object.
            // Let's cast it safely.
            // Actually, standard select join returns an array for one-to-many, or object for one-to-one if !inner?
            // We'll normalize in the map if needed, but 'meeting_summaries(*)' typically returns an object if defined as single.
            // Let's assume it might ideally be an object, but handled as any for safety.
            setMeetings((data as any[]) || []);
        }

        setIsLoading(false);
    };

    const handleOpenSummary = (meeting: HistoryMeeting) => {
        // Check if summary exists
        const summaryData = Array.isArray(meeting.meeting_summaries)
            ? meeting.meeting_summaries[0]
            : meeting.meeting_summaries;

        if (!summaryData) {
            toast({
                title: 'No Summary',
                description: 'This meeting does not have an AI summary.',
            });
            return;
        }

        // Adapt database structure to component's expected format
        const adaptedSummary = {
            keyPoints: summaryData.key_points || [],
            actionItems: summaryData.action_items || [],
            decisions: summaryData.decisions || [],
        };

        setSelectedSummary(adaptedSummary);
        setSelectedMeeting(meeting);
        setIsSummaryOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Meeting History</h1>
                        <p className="text-muted-foreground mt-1">
                            Review transcripts, summaries, and recordings from past sessions.
                        </p>
                    </div>
                </div>

                {meetings.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card/30">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium">No past meetings</h3>
                        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                            Once you finish a meeting, it will appear here with its AI summary.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {meetings.map((meeting) => {
                            const summary = Array.isArray(meeting.meeting_summaries)
                                ? meeting.meeting_summaries[0]
                                : meeting.meeting_summaries;

                            const hasSummary = !!summary;

                            return (
                                <Card key={meeting.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl">{meeting.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(meeting.created_at)}
                                                <span className="text-muted-foreground/50">•</span>
                                                <Clock className="w-4 h-4" />
                                                {formatTime(meeting.created_at)}
                                            </CardDescription>
                                        </div>
                                        {hasSummary ? (
                                            <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-200">
                                                AI Summary Available
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">
                                                No Summary
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2 mt-4">
                                            {/* Summary Button */}
                                            <Button
                                                variant={hasSummary ? "default" : "secondary"}
                                                className={hasSummary ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
                                                disabled={!hasSummary}
                                                onClick={() => handleOpenSummary(meeting)}
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                View Summary
                                            </Button>

                                            {/* Placeholder for Recording - future feature */}
                                            {/* 
                      <Button variant="outline" disabled>
                        <Play className="w-4 h-4 mr-2" />
                        Recording (Coming Soon)
                      </Button> 
                      */}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <SummaryModal
                    isOpen={isSummaryOpen}
                    onClose={() => setIsSummaryOpen(false)}
                    summary={selectedSummary}
                    meetingTitle={selectedMeeting?.title || 'Meeting Summary'}
                    // We don't have exact duration/count persisted yet, so using placeholders or calculating
                    duration={0}
                    participantCount={0}
                />
            </main>
        </div>
    );
}
