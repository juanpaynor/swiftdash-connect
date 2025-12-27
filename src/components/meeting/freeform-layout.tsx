import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
    ParticipantView,
    useCallStateHooks,
    StreamVideoParticipant
} from '@stream-io/video-react-sdk';
import { MeetingWhiteboard } from '@/components/meeting/whiteboard/meeting-whiteboard';

export const FreeformLayout = ({ branding, meetingId, isWhiteboardOpen }: { branding?: any, meetingId: string, isWhiteboardOpen: boolean }) => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const [zIndices, setZIndices] = useState<Record<string, number>>({});
    const [highestZ, setHighestZ] = useState(10);
    const [whiteboardZ, setWhiteboardZ] = useState(20);

    const bringToFront = (sessionId: string) => {
        setHighestZ(prev => prev + 1);
        setZIndices(prev => ({ ...prev, [sessionId]: highestZ + 1 }));
    };

    const bringWhiteboardToFront = () => {
        setHighestZ(prev => prev + 1);
        setWhiteboardZ(highestZ + 1);
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
            {participants.flatMap((p, index) => {
                const tiles = [];
                // 1. Camera Tile
                tiles.push({
                    id: p.sessionId,
                    participant: p,
                    trackType: 'videoTrack' as const,
                    isScreenShare: false,
                    label: p.name || p.userId,
                    width: 320,
                    height: 180
                });

                // 2. Screen Share Tile (if applicable)
                if (p.screenShareStream) {
                    tiles.push({
                        id: `${p.sessionId}-screen`,
                        participant: p,
                        trackType: 'screenShareTrack' as const,
                        isScreenShare: true,
                        label: `${p.name || p.userId}'s Screen`,
                        width: 640,
                        height: 360 // Larger for screen share
                    });
                }
                return tiles;
            }).map((tile, globalIndex) => {
                const initialPos = getInitialPos(globalIndex);

                return (
                    <Rnd
                        key={tile.id}
                        default={{
                            x: initialPos.x,
                            y: initialPos.y,
                            width: tile.width,
                            height: tile.height,
                        }}
                        minWidth={160}
                        minHeight={90}
                        // Remove bounds="parent" to prevent clipping issues for now
                        style={{
                            zIndex: zIndices[tile.id] || globalIndex + 1,
                        }}
                        onDragStart={() => bringToFront(tile.id)}
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
                                {tile.isScreenShare && <span className="text-[10px] text-white/50 absolute left-2">Screen Share</span>}
                            </div>

                            {/* Video Container */}
                            <div className="flex-1 relative w-full overflow-hidden">
                                <ParticipantView
                                    participant={tile.participant}
                                    trackType={tile.trackType}
                                    className="w-full h-full object-cover"
                                />

                                {/* Explicit Logo Overlay (Only on Camera tiles?) -> keep on all for branding consistency */}
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
                                {tile.label} {tile.participant.isLocalParticipant && !tile.isScreenShare ? '(You)' : ''}
                            </div>
                        </div>
                    </Rnd>
                );
            })}
            {/* Resizable Whiteboard Tile */}
            {isWhiteboardOpen && (
                <Rnd
                    default={{
                        x: 100,
                        y: 50,
                        width: 800,
                        height: 600,
                    }}
                    minWidth={300}
                    minHeight={200}
                    style={{
                        zIndex: whiteboardZ,
                    }}
                    onDragStart={bringWhiteboardToFront}
                    dragHandleClassName="whiteboard-drag-handle"
                    enableUserSelectHack={false}
                    className="border border-white/20 shadow-2xl bg-white rounded-lg overflow-hidden flex flex-col pointer-events-auto"
                >
                    {/* Header / Drag Handle */}
                    <div className="whiteboard-drag-handle h-8 bg-gray-100 border-b border-gray-200 cursor-move flex items-center px-3 justify-between shrink-0">
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            🖌️ Collaborative Whiteboard
                        </span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-400/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                            <div className="w-3 h-3 rounded-full bg-green-400/50" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 relative w-full overflow-hidden">
                        <MeetingWhiteboard meetingId={meetingId} />
                    </div>
                </Rnd>
            )}
        </div>
    );
};
