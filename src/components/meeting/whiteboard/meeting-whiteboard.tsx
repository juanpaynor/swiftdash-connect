'use client';

import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { useWhiteboardSync } from '@/lib/whiteboard/use-whiteboard-sync';

interface MeetingWhiteboardProps {
    meetingId: string;
}

export const MeetingWhiteboard = ({ meetingId }: MeetingWhiteboardProps) => {
    const store = useWhiteboardSync(meetingId);

    return (
        <div className="absolute inset-0 w-full h-full bg-white z-0 overflow-hidden">
            <Tldraw store={store} />
        </div>
    );
};
