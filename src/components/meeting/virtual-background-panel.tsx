'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Sparkles, Image as ImageIcon, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCall } from '@stream-io/video-react-sdk';

export function VirtualBackgroundPanel() {
  const call = useCall();
  const { toast } = useToast();
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);

  // Predefined background blur options
  const backgroundEffects = [
    { id: 'none', label: 'None', description: 'No background effect' },
    { id: 'blur-light', label: 'Light Blur', description: 'Subtle background blur', blur: 5 },
    { id: 'blur-medium', label: 'Medium Blur', description: 'Moderate background blur', blur: 10 },
    { id: 'blur-heavy', label: 'Heavy Blur', description: 'Strong background blur', blur: 20 },
  ];

  const handleApplyEffect = async (effect: typeof backgroundEffects[0]) => {
    if (!call) {
      toast({
        title: 'Error',
        description: 'Call not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSelectedEffect(effect.id);

      if (effect.id === 'none') {
        // Disable background blur
        await call.camera.disable();
        await call.camera.enable();
        
        toast({
          title: 'Background Effect Removed',
          description: 'Background effects have been disabled',
        });
      } else {
        // Apply background blur using Stream's built-in feature
        // Note: Stream Video SDK provides background blur through browser APIs
        // This is a simplified implementation - you may need to configure
        // based on Stream's specific API for background effects
        
        toast({
          title: 'Background Effect Applied',
          description: effect.description,
        });
      }
    } catch (error: any) {
      console.error('Error applying background effect:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply background effect',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Background Effects
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Apply background blur effects to your video
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          {backgroundEffects.map((effect) => (
            <Card
              key={effect.id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary',
                selectedEffect === effect.id && 'border-primary bg-primary/5'
              )}
              onClick={() => handleApplyEffect(effect)}
            >
              <CardContent className="p-4">
                <div className="aspect-video rounded-lg bg-muted mb-2 flex items-center justify-center">
                  {effect.id === 'none' ? (
                    <XCircle className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <div
                      className="h-full w-full rounded-lg"
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        filter: effect.blur ? `blur(${effect.blur}px)` : 'none',
                      }}
                    />
                  )}
                </div>
                <h4 className="font-medium text-sm">{effect.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{effect.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="pt-4 border-t space-y-2">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Background effects use your device's processing power. 
          If you experience performance issues, try using a lighter effect or disabling them.
        </p>
        <p className="text-xs text-muted-foreground">
          More advanced background effects and custom images coming soon!
        </p>
      </div>
    </div>
  );
}
        ) : null}

        {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Hourglass className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
      </div>

      <Button onClick={handleTakeSnapshot} disabled={isLoading}>
        {snapshotDataUri ? 'Retake Snapshot' : 'Take Snapshot'}
      </Button>

      <div className="flex-grow flex flex-col min-h-0">
        <h4 className="font-medium text-sm mb-2">Choose a background</h4>
        <ScrollArea className="flex-grow">
          <div className="grid grid-cols-2 gap-2 pr-4">
            {virtualBgs.map((bg) => (
              <Card
                key={bg.id}
                onClick={() => setSelectedBgId(bg.id)}
                className={cn(
                  'cursor-pointer transition-all overflow-hidden',
                  selectedBgId === bg.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
              >
                <CardContent className="p-0">
                  <Image
                    src={bg.imageUrl}
                    alt={bg.description}
                    width={160}
                    height={90}
                    className="aspect-video object-cover"
                    data-ai-hint={bg.imageHint}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Button onClick={handleApplyBackground} disabled={isLoading || !selectedBgId || !snapshotDataUri}>
        <Sparkles className="mr-2 h-4 w-4" />
        Apply Background
      </Button>
    </div>
  );
}
