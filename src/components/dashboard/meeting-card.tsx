"use client";

import Link from "next/link";
import { Meeting } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MoreHorizontal, PhoneOff, ArrowRight } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MeetingCardProps {
    meeting: Meeting;
    isHost: boolean;
    onEndMeeting: (id: string) => void;
}

export function MeetingCard({ meeting, isHost, onEndMeeting }: MeetingCardProps) {
    const isLive = meeting.status === "live";
    const isEnded = meeting.status === "completed";

    const startTime = meeting.scheduled_time
        ? new Date(meeting.scheduled_time)
        : new Date(meeting.created_at);

    const timeString = startTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    const dateString = startTime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    return (
        <div className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300">
            {/* Time / Date Column */}
            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0 min-w-[80px] text-muted-foreground">
                <span className="text-sm font-semibold text-foreground">{timeString}</span>
                <span className="text-xs">{dateString}</span>
            </div>

            {/* Status Line (Vertical on desktop) */}
            <div className={`hidden sm:block w-1 h-10 rounded-full ${isLive ? 'bg-green-500' : (isEnded ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary')}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate pr-2">{meeting.title}</h3>
                    {isLive && (
                        <Badge variant="default" className="bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-green-500/20 px-2 py-0.5 h-auto text-[10px] uppercase tracking-wide">
                            Live
                        </Badge>
                    )}
                    {isEnded && <Badge variant="secondary" className="text-[10px]">Ended</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                        <span className="select-all font-mono">#{meeting.meeting_slug}</span>
                    </div>
                    {isHost && <span className="text-primary/80 font-medium">Host</span>}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
                {!isEnded && (
                    <Link href={`/meeting/${meeting.id}`}>
                        <Button
                            size="sm"
                            className={isLive ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20" : ""}
                            variant={isLive ? "default" : "outline"}
                        >
                            {isLive ? <Video className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                            {isLive ? "Join Now" : "Details"}
                        </Button>
                    </Link>
                )}

                {isHost && isLive && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEndMeeting(meeting.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20">
                                <PhoneOff className="w-4 h-4 mr-2" /> End Meeting
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
