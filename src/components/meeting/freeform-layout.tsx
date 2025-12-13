import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
    ParticipantView,
    useCallStateHooks,
    StreamVideoParticipant
} from '@stream-io/video-react-sdk';

export const FreeformLayout = ({ branding }: { branding?: any }) => {
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
        // Safe default for window size
        const maxWidth = typeof window !== 'undefined' ? window.innerWidth - 320 : 1000;
        const maxHeight = typeof window !== 'undefined' ? window.innerHeight - 180 : 800;

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
            x: Math.min(startX + col * (width + gap), maxWidth),
            y: Math.min(startY + row * (height + gap), maxHeight)
        };
    };

    // Derived border styles
    const borderStyle = branding?.meeting_border_style || 'subtle';
    const borderColor = branding?.secondary_color || 'rgba(255, 255, 255, 0.2)';
    const borderWidth = borderStyle === 'bold' ? '2px' : borderStyle === 'none' ? '0px' : '1px';

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
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
                        // Remove bounds="parent" to prevent clipping issues for now
                        style={{
                            zIndex: zIndices[p.sessionId] || index + 1,
                        }}
                        onDragStart={() => bringToFront(p.sessionId)}
                        className="rounded-lg overflow-hidden shadow-2xl bg-gray-900 transition-colors"
                    >
                        {/* Wrapper for Border and Content */}
                        <div
                            className="relative w-full h-full flex flex-col rounded-lg overflow-hidden"
                            style={{
                                border: `${borderWidth} solid ${borderColor}`
                            }}
                        >
                            {/* Drag Handle Bar */}
                            <div className="h-6 bg-black/60 cursor-move flex items-center justify-center shrink-0 z-50 hover:bg-black/80 transition-colors">
                                <div className="w-8 h-1 rounded-full bg-white/30" />
                            </div>

                            {/* Video Container */}
                            <div className="flex-1 relative w-full overflow-hidden">
                                <ParticipantView
                                    participant={p}
                                    trackType="videoTrack"
                                    className="w-full h-full"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />

                                {/* Explicit Logo Overlay */}
                                {branding?.show_logo_on_tiles && branding?.logo_url && (
                                    <div
                                        className="absolute bottom-2 right-2 w-12 h-12 pointer-events-none z-10 opacity-70"
                                        style={{
                                            backgroundImage: `url('${branding.logo_url}')`,
                                            backgroundSize: 'contain',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center'
                                        }}
                                    />
                                )}
                            </div>

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
