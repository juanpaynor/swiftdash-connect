'use client';

import { useEffect, useState } from 'react';
import { Chat, Channel, ChannelHeader, MessageInput, MessageList, Thread, Window } from 'stream-chat-react';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import 'stream-chat-react/dist/css/v2/index.css';
import { useBranding } from '@/lib/branding/theme-provider';
import { Loader2 } from 'lucide-react';

interface MeetingChatProps {
  meetingId: string;
  userId: string;
  userName: string;
  userImage?: string;
  token: string;
  apiKey: string;
}

export function MeetingChat({ meetingId, userId, userName, userImage, token, apiKey }: MeetingChatProps) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const { branding } = useBranding();

  useEffect(() => {
    initializeChat();

    return () => {
      if (channel) {
        channel.stopWatching();
      }
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [meetingId, userId]);

  const initializeChat = async () => {
    try {
      // Initialize Stream Chat client
      const client = StreamChat.getInstance(apiKey);

      // Connect user
      await client.connectUser(
        {
          id: userId,
          name: userName,
          image: userImage,
        },
        token
      );

      setChatClient(client);

      // Create or get channel for this meeting
      // Use 'livestream' type to allow open participation without explicit membership checks
      const chatChannel = client.channel('livestream', meetingId, {
        name: `Meeting Chat`,
      });

      await chatChannel.watch();
      setChannel(chatChannel);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  // Apply custom branding to chat
  useEffect(() => {
    if (branding && chatClient) {
      const root = document.documentElement;

      // Apply branding colors to Stream Chat CSS variables
      if (branding.primary_color) {
        root.style.setProperty('--str-chat__primary-color', branding.primary_color);
      }
      if (branding.secondary_color) {
        root.style.setProperty('--str-chat__secondary-color', branding.secondary_color);
      }
    }
  }, [branding, chatClient]);

  if (!chatClient || !channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Chat client={chatClient} theme="str-chat__theme-light">
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}
