'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Sparkles, Hourglass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateVirtualBackground, getSnapshotDataUri } from '@/app/actions';

export function VirtualBackgroundPanel() {
  const [selectedBgId, setSelectedBgId] = useState<string | null>(null);
  const [snapshotDataUri, setSnapshotDataUri] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const virtualBgs = PlaceHolderImages.filter((img) => img.id.startsWith('virtual-bg-'));
  const userVideoFeed = PlaceHolderImages.find((img) => img.id === 'user-video-feed');

  const handleTakeSnapshot = async () => {
    setIsLoading(true);
    setResultImage(null);
    const result = await getSnapshotDataUri();
    if(result.error || !result.dataUri) {
      toast({
        variant: "destructive",
        title: "Snapshot Failed",
        description: result.error || 'Could not capture user image.',
      });
    } else {
      setSnapshotDataUri(result.dataUri);
    }
    setIsLoading(false);
  }

  const handleApplyBackground = async () => {
    if (!snapshotDataUri || !selectedBgId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please take a snapshot and select a background.',
      });
      return;
    }

    setIsLoading(true);
    setResultImage(null);
    const result = await generateVirtualBackground(snapshotDataUri, selectedBgId);

    if (result.error || !result.modifiedPhotoDataUri) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error || 'An unknown error occurred.',
      });
    } else {
      setResultImage(result.modifiedPhotoDataUri);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <h3 className="font-semibold">Virtual Backgrounds</h3>
      <p className="text-sm text-muted-foreground">Replace your background with a virtual one.</p>
      
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
        {resultImage ? (
          <Image src={resultImage} alt="Modified background" layout="fill" objectFit="cover" />
        ) : snapshotDataUri ? (
          <Image src={snapshotDataUri} alt="User snapshot" layout="fill" objectFit="cover" />
        ) : userVideoFeed ? (
          <Image src={userVideoFeed.imageUrl} alt="User video feed" data-ai-hint={userVideoFeed.imageHint} layout="fill" objectFit="cover" />
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
