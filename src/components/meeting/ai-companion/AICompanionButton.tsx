'use client';

import { Button } from '@/components/ui/button';

interface AICompanionButtonProps {
    onClick: () => void;
    isActive: boolean;
    isProcessing: boolean;
}

export function AICompanionButton({ onClick, isActive, isProcessing }: AICompanionButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-11 w-11 sm:h-10 sm:w-10 text-white ${isActive ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:bg-white/20'
                } ${isProcessing ? 'animate-pulse' : ''}`}
            onClick={onClick}
            title={isActive ? 'AI Companion Active' : 'Enable AI Companion'}
        >
            <span className="text-xl">{isProcessing ? '⏳' : '🤖'}</span>
        </Button>
    );
}
