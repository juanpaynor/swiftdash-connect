import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
    ParticipantView,
    useCallStateHooks,
    StreamVideoParticipant
} from '@stream-io/video-react-sdk';

export const FreeformLayout = () => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const [zIndices, setZIndices] = useState<Record<string, number>>({});
    const [highestZ, setHighestZ] = useState(10);

    // Bring clicked tile to front
    const bringToFront = (sessionId: string) => {
        setHighestZ(prev => prev + 1);
        setZIndices(prev => ({ ...prev, [sessionId]: highestZ + 1 }));
    };

    /**
     * Calculate initial grid positions so tiles don't stack
     * 3 columns grid logic
     */
    const getInitialPos = (index: number) => {
        const cols = 3;
        const width = 320;
        const height = 180;
        const gap = 20;

        // Center offset
        const startX = 50;
        const startY = 80;

        const col = index % cols;
        const row = Math.floor(index / cols);

        return {
            x: startX + col * (width + gap),
            y: startY + row * (height + gap)
        };
    };

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {/* pointer-events-none allows clicks to pass through empty areas, 
          but Rnd components need pointer-events-auto */}

            {participants.map((p, index) => {
                const initialPos = getInitialPos(index);

                return (
                    <Rnd
                        key={p.sessionId}
                        default={{
                            x: initialPos.x,
                            y: initialPos.y,
                            width: 320,
                            height: 180,
                        }}
                        minWidth={160}
                        minHeight={90}
                        bounds="parent"
                        style={{
                            zIndex: zIndices[p.sessionId] || 1,
                            pointerEvents: 'auto', // Re-enable pointer events for the tile
                        }}
                        onDragStart={() => bringToFront(p.sessionId)}
                        className="border-2 border-transparent hover:border-primary/50 transition-colors rounded-lg overflow-hidden shadow-lg bg-black/50 backdrop-blur-sm"
                    >
                        <div className="relative w-full h-full group">
                            {/* Drag Handle Bar */}
                            <div className="absolute top-0 left-0 right-0 h-6 z-20 opacity-0 group-hover:opacity-100 bg-black/40 cursor-move flex items-center justify-center transition-opacity">
                                <div className="w-8 h-1 rounded-full bg-white/20" />
                            </div>

                            <ParticipantView
                                participant={p}
                                trackType="videoParticipant"
                                className="w-full h-full object-cover"
                            />

                            {/* Name Tag Overlay */}
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white pointer-events-none z-10">
                                {p.name || p.userId} {p.isLocalParticipant ? '(You)' : ''}
                            </div>
                        </div>
                    </Rnd>
                );
            })}
        </div>
    );
};
