import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Poll = {
    id: string;
    question: string;
    options: string[];
    isActive: boolean;
    createdBy: string;
};

export type PollResults = Record<number, number>; // optionIndex -> count
export type UserVote = Record<string, number>; // userId -> optionIndex

export function usePollSystem(meetingId: string, userId: string, isHost: boolean) {
    const [activePoll, setActivePoll] = useState<Poll | null>(null);
    const [pollResults, setPollResults] = useState<PollResults>({});
    const [userVotes, setUserVotes] = useState<UserVote>({}); // To prevent double voting and show selection
    const [hasVoted, setHasVoted] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (!meetingId) return;

        const channel = supabase.channel(`meeting_polls:${meetingId}`);

        channel
            .on('broadcast', { event: 'poll-start' }, ({ payload }) => {
                setActivePoll(payload);
                setPollResults({});
                setUserVotes({});
                setHasVoted(false);
                if (payload.createdBy !== userId) {
                    toast({ title: "New Poll Started", description: payload.question });
                }
            })
            .on('broadcast', { event: 'poll-vote' }, ({ payload }) => {
                const { optionIndex, voterId } = payload;

                // Update results
                setPollResults(prev => ({
                    ...prev,
                    [optionIndex]: (prev[optionIndex] || 0) + 1
                }));

                // Track who voted (locally just to verify unique votes if we wanted, 
                // but mainly we just care about aggregate for the chart)
                // In a real app we might want to prevent double-counting from same user 
                // effectively, but broadcast is ephemeral. 
                // We'll rely on local state 'hasVoted' for UI locking.
            })
            .on('broadcast', { event: 'poll-end' }, () => {
                setActivePoll(null); // Or keep it visible but inactive? usage choice. 
                // For now, let's just close it.
                toast({ title: "Poll Ended", description: "The host has ended the poll." });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [meetingId, userId]);

    const startPoll = async (question: string, options: string[]) => {
        if (!isHost) return;

        const newPoll: Poll = {
            id: crypto.randomUUID(),
            question,
            options,
            isActive: true,
            createdBy: userId,
        };

        setActivePoll(newPoll);
        setPollResults({});
        setHasVoted(false);

        await supabase.channel(`meeting_polls:${meetingId}`).send({
            type: 'broadcast',
            event: 'poll-start',
            payload: newPoll,
        });
    };

    const vote = async (optionIndex: number) => {
        if (!activePoll || hasVoted) return;

        setHasVoted(true);

        // Optimistic local update
        setPollResults(prev => ({
            ...prev,
            [optionIndex]: (prev[optionIndex] || 0) + 1
        }));

        await supabase.channel(`meeting_polls:${meetingId}`).send({
            type: 'broadcast',
            event: 'poll-vote',
            payload: {
                pollId: activePoll.id,
                optionIndex,
                voterId: userId
            },
        });
    };

    const endPoll = async () => {
        if (!isHost) return;
        setActivePoll(null);
        await supabase.channel(`meeting_polls:${meetingId}`).send({
            type: 'broadcast',
            event: 'poll-end',
            payload: {},
        });
    };

    return {
        activePoll,
        pollResults,
        startPoll,
        vote,
        endPoll,
        hasVoted
    };
}
