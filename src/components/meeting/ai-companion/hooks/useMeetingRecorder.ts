import { useState, useRef, useCallback, useEffect } from 'react';

export function useMeetingRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            // Try to get existing audio stream from video call first
            const audioElements = document.querySelectorAll('audio');
            let stream: MediaStream | null = null;

            for (const audio of audioElements) {
                if (audio.srcObject instanceof MediaStream) {
                    stream = audio.srcObject;
                    break;
                }
            }

            // Fallback to microphone if no stream found
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                chunksRef.current = [];
            };

            mediaRecorder.start();
            setIsRecording(true);
            console.log('🎙️ Recording started');
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            console.log('mn🛑 Recording stopped');
        }
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording,
        audioBlob,
        setAudioBlob // Allow clearing the blob
    };
}
