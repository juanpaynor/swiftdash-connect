import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'AssemblyAI API key not configured' },
            { status: 500 }
        );
    }

    try {
        // Create a temporary token for real-time transcription
        const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                expires_in: 3600, // Token expires in 1 hour
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('AssemblyAI token error:', error);
            return NextResponse.json(
                { error: 'Failed to create temporary token' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ token: data.token });
    } catch (error: any) {
        console.error('Token generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate token' },
            { status: 500 }
        );
    }
}
