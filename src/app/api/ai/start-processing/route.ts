import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('audio') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No audio file provided' },
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

        // 1. Upload the audio file to AssemblyAI
        const arrayBuffer = await file.arrayBuffer();
        const headers = {
            'authorization': apiKey,
            'content-type': 'application/octet-stream', // Important for raw audio upload
        };

        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers,
            body: arrayBuffer,
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            console.error('AssemblyAI Upload Error:', error);
            return NextResponse.json(
                { error: 'Failed to upload audio to AssemblyAI' },
                { status: uploadResponse.status }
            );
        }

        const uploadData = await uploadResponse.json();
        const uploadUrl = uploadData.upload_url;

        // 2. Start Transcription
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: uploadUrl,
                speaker_labels: true, // Enable speaker diarization
            }),
        });

        if (!transcriptResponse.ok) {
            const error = await transcriptResponse.text();
            console.error('AssemblyAI Transcription Start Error:', error);
            return NextResponse.json(
                { error: 'Failed to start transcription' },
                { status: transcriptResponse.status }
            );
        }

        const transcriptData = await transcriptResponse.json();

        return NextResponse.json({
            transcript_id: transcriptData.id
        });

    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal processing error' },
            { status: 500 }
        );
    }
}
