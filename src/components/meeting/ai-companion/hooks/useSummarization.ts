import { useState } from 'react';

interface ActionItem {
    text: string;
    assignee: string | null;
    completed?: boolean;
}

interface MeetingSummary {
    keyPoints: string[];
    actionItems: ActionItem[];
    decisions: string[];
}

export function useSummarization() {
    const [summary, setSummary] = useState<MeetingSummary | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = async (transcript: string, meetingId: string) => {
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, meetingId }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate summary');
            }

            const data = await response.json();
            setSummary(data.summary);
            return data.summary;
        } catch (err: any) {
            console.error('Summarization error:', err);
            setError(err.message);
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    return { summary, isGenerating, error, generateSummary };
}
