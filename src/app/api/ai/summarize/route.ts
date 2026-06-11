import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { transcript, meetingId } = await request.json();

        if (!transcript || !meetingId) {
            return NextResponse.json(
                { error: 'Missing transcript or meetingId' },
                { status: 400 }
            );
        }

        // Generate summary using Groq
        const prompt = `Analyze this meeting transcript and provide a structured summary.

Transcript:
${transcript}

Please provide:
1. Key Points (3-5 main topics discussed)
2. Action Items (tasks mentioned with assignees if specified, format as @Name - Task)
3. Decisions Made (important conclusions or agreements)

Return ONLY valid JSON in this exact format:
{
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": [{"text": "task description", "assignee": "@Name or null"}],
  "decisions": ["decision 1", "decision 2"]
}`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const responseText = completion.choices[0].message.content || '{}';

        // Parse the JSON response
        let summary;
        try {
            summary = JSON.parse(responseText);
        } catch (e) {
            // If parsing fails, try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                summary = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse AI response');
            }
        }

        // Save summary to database
        const supabase = await createClient();
        const { error: dbError } = await supabase
            .from('meeting_summaries')
            .upsert({
                meeting_id: meetingId,
                key_points: summary.keyPoints || [],
                action_items: summary.actionItems || [],
                decisions: summary.decisions || [],
                full_transcript: transcript,
                updated_at: new Date().toISOString(),
            });

        if (dbError) {
            console.error('Database error:', dbError);
        }

        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error('Summarization error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
