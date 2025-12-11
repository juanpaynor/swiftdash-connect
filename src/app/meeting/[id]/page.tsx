'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  MessageSquare,
  Users,
  Wand2,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { VirtualBackgroundPanel } from '@/components/meeting/virtual-background-panel';
import { cn } from '@/lib/utils';

export default function MeetingPage({ params }: { params: { id: string } }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVidOn, setIsVidOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  const participants = [
    { name: 'Alex', avatarId: 'user-avatar-2', isSpeaking: false },
    { name: 'Maria', avatarId: 'user-avatar-3', isSpeaking: true },
    { name: 'You', avatarId: 'user-video-feed', isSpeaking: false },
    { name: 'Tom', avatarId: 'user-avatar-4', isSpeaking: false },
  ];
  
  const mainSpeaker = participants.find(p => p.isSpeaking) || participants[0];
  const otherParticipants = participants.filter(p => p.name !== mainSpeaker.name);
  const mainSpeakerImage = PlaceHolderImages.find(img => img.id === mainSpeaker.avatarId);
  
  const chatMessages = [
      { user: 'Maria', text: 'Great point, Alex!', time: '10:31 AM'},
      { user: 'You', text: 'Can you elaborate on the Q3 forecast?', time: '10:32 AM'},
      { user: 'Alex', text: 'Sure, I'll pull up the numbers now.', time: '10:32 AM'},
  ]

  const ChatPanel = () => (
      <div className="flex flex-col h-full p-4">
          <div className="flex-grow overflow-auto pr-4">
              <ScrollArea className="h-full">
                  <div className="space-y-4">
                      {chatMessages.map((msg, idx) => (
                           <div key={idx} className={cn("flex items-start gap-3", msg.user === 'You' && 'flex-row-reverse')}>
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={PlaceHolderImages.find(i => i.id === participants.find(p=>p.name === msg.user)?.avatarId)?.imageUrl} />
                                  <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className={cn("p-3 rounded-lg max-w-[75%]", msg.user === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                  <p className="text-sm">{msg.text}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{msg.time}</p>
                              </div>
                           </div>
                      ))}
                  </div>
              </ScrollArea>
          </div>
          <div className="mt-4 flex gap-2">
              <Input placeholder="Type a message..." />
              <Button>Send</Button>
          </div>
      </div>
  );

  const ParticipantsPanel = () => (
      <div className="p-4 space-y-4">
          {participants.map(p => (
              <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Avatar>
                          <AvatarImage src={PlaceHolderImages.find(i => i.id === p.avatarId)?.imageUrl} />
                          <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{p.name}</span>
                  </div>
                  <div className="flex gap-2 text-muted-foreground">
                      <Mic className="h-5 w-5" />
                      <Video className="h-5 w-5" />
                  </div>
              </div>
          ))}
      </div>
  )

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      <header className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Project Phoenix Kick-off</h1>
        </div>
        <div className="text-sm text-muted-foreground">Meeting ID: {params.id}</div>
      </header>

      <main className="flex-1 flex p-4 gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 rounded-lg overflow-hidden bg-muted relative">
            {mainSpeakerImage && (
              <Image src={mainSpeakerImage.imageUrl} alt="Main Speaker" layout="fill" objectFit="cover" data-ai-hint={mainSpeakerImage.imageHint} />
            )}
             <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">{mainSpeaker.name}</div>
          </div>
          <div className="h-32 flex gap-4">
            {otherParticipants.map(p => {
              const pImage = PlaceHolderImages.find(img => img.id === p.avatarId);
              return pImage ? (
                <div key={p.name} className="aspect-video h-full rounded-lg overflow-hidden bg-muted relative">
                  <Image src={pImage.imageUrl} alt={p.name} layout="fill" objectFit="cover" data-ai-hint={pImage.imageHint}/>
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white px-1 py-0.5 rounded text-xs">{p.name}</div>
                </div>
              ) : null
            })}
          </div>
        </div>
      </main>

      <footer className="p-4 flex justify-center">
        <div className="bg-card/80 backdrop-blur-sm border rounded-full p-2 flex items-center gap-2 shadow-lg">
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12" onClick={() => setIsMicOn(!isMicOn)}>
            {isMicOn ? <Mic /> : <MicOff className="text-destructive" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12" onClick={() => setIsVidOn(!isVidOn)}>
            {isVidOn ? <Video /> : <VideoOff className="text-destructive" />}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-12 h-12">
                <Users />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0">
               <SheetHeader className="p-4 border-b"><SheetTitle>Participants</SheetTitle></SheetHeader>
               <ParticipantsPanel />
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-12 h-12">
                <MessageSquare />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
              <SheetHeader className="p-4 border-b"><SheetTitle>Chat</SheetTitle></SheetHeader>
              <ChatPanel />
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12" onClick={() => setIsSharingScreen(!isSharingScreen)} >
            <ScreenShare className={cn(isSharingScreen && "text-primary")} />
          </Button>
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-12 h-12">
                <Wand2 />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>AI Tools</SheetTitle>
              </SheetHeader>
              <VirtualBackgroundPanel />
            </SheetContent>
          </Sheet>

          <Separator orientation="vertical" className="h-6" />
          <Link href="/dashboard">
            <Button variant="destructive" size="icon" className="rounded-full w-16 h-12">
              <PhoneOff />
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
