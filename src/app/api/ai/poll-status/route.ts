import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('id');

    if (!transcriptId) {
        return NextResponse.json(
            { error: 'No transcript ID provided' },
            { status: 400 }
        );
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'AssemblyAI API key not configured' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
            method: 'GET',
            headers: {
                'authorization': apiKey,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('AssemblyAI Polling Error:', error);
            return NextResponse.json(
                { error: 'Failed to poll transcription status' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Check status
        // Possible statuses: queued, processing, completed, error
        if (data.status === 'completed') {
            return NextResponse.json({
                status: 'completed',
                text: data.text,
                confidence: data.confidence,
                words: data.words,
            });
        } else if (data.status === 'error') {
            return NextResponse.json({
                status: 'error',
                error: data.error,
            });
        } else {
            return NextResponse.json({
                status: data.status, // 'queued' or 'processing'
            });
        }

    } catch (error: any) {
        console.error('Polling error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal polling error' },
            { status: 500 }
        );
    }
}
