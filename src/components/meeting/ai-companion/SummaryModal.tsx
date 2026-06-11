'use client';

import { X, Download, Copy, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ActionItem {
    text: string;
    assignee: string | null;
    completed?: boolean;
}

interface MeetingSummary {
    keyPoints: string[];
    actionItems: ActionItem[];
    decisions: string[];
}

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: MeetingSummary | null;
    meetingTitle: string;
    duration: number; // in minutes
    participantCount: number;
}

export function SummaryModal({
    isOpen,
    onClose,
    summary,
    meetingTitle,
    duration,
    participantCount,
}: SummaryModalProps) {
    const { toast } = useToast();

    if (!isOpen || !summary) return null;

    const handleCopy = () => {
        const text = `
Meeting Summary: ${meetingTitle}
Duration: ${duration} minutes
Participants: ${participantCount}

Key Points:
${summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Action Items:
${summary.actionItems.map((a, i) => `${i + 1}. ${a.assignee ? `${a.assignee} - ` : ''}${a.text}`).join('\n')}

Decisions Made:
${summary.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}
    `.trim();

        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'Summary copied to clipboard',
        });
    };

    const handleDownload = () => {
        const text = `
Meeting Summary: ${meetingTitle}
Duration: ${duration} minutes
Participants: ${participantCount}

Key Points:
${summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Action Items:
${summary.actionItems.map((a, i) => `${i + 1}. ${a.assignee ? `${a.assignee} - ` : ''}${a.text}`).join('\n')}

Decisions Made:
${summary.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}
    `.trim();

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meetingTitle.replace(/\s+/g, '_')}_summary.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Downloaded!',
            description: 'Summary downloaded as text file',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">✨</span>
                        Meeting Summary
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Meeting Info */}
                    <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>{meetingTitle} - {new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>⏱️</span>
                            <span>Duration: {duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>👥</span>
                            <span>Participants: {participantCount}</span>
                        </div>
                    </div>

                    {/* Key Points */}
                    {summary.keyPoints.length > 0 && (
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span>📝</span>
                                Key Points
                            </h3>
                            <ul className="space-y-2 text-gray-300">
                                {summary.keyPoints.map((point, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-indigo-400">•</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Items */}
                    {summary.actionItems.length > 0 && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span>✅</span>
                                Action Items
                            </h3>
                            <ul className="space-y-2 text-gray-300">
                                {summary.actionItems.map((item, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-green-400">□</span>
                                        <span>
                                            {item.assignee && (
                                                <span className="text-green-400 font-medium">{item.assignee} - </span>
                                            )}
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Decisions */}
                    {summary.decisions.length > 0 && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span>💡</span>
                                Decisions Made
                            </h3>
                            <ul className="space-y-2 text-gray-300">
                                {summary.decisions.map((decision, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span>{decision}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 flex gap-3 p-6 bg-slate-900/95 backdrop-blur-sm border-t border-white/10">
                    <Button
                        onClick={handleDownload}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                </div>
            </div>
        </div>
    );
}
