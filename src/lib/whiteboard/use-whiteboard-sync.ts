import { useEffect, useState } from 'react';
import {
    Editor,
    StoreListener,
    createTLStore,
    defaultShapeUtils,
    throttle
} from 'tldraw';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useWhiteboardSync(meetingId: string) {
    const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const channelName = `meeting_whiteboard:${meetingId}`;

        const newChannel = supabase.channel(channelName);

        // Subscribe to broadcast events
        newChannel
            .on('broadcast', { event: 'whiteboard-update' }, ({ payload }) => {
                // Apply remote changes to local store
                // Payload comes as { changes: { added, updated, removed } }
                if (payload.changes) {
                    store.mergeRemoteChanges(() => {
                        const { added, updated, removed } = payload.changes;

                        // Tldraw expects records in a specific format
                        // We just pass the raw "changes" object we sent
                        if (Object.keys(added).length > 0) store.put(Object.values(added));
                        if (Object.keys(updated).length > 0) store.put(Object.values(updated).map(u => (u as any)[1]));
                        if (Object.keys(removed).length > 0) store.remove(Object.keys(removed) as any[]);
                    });
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to Whiteboard Sync');
                }
            });

        setChannel(newChannel);

        return () => {
            supabase.removeChannel(newChannel);
        };
    }, [meetingId, store]);

    // Listen to local changes and broadcast them
    useEffect(() => {
        if (!channel) return;

        const handleChange: StoreListener<any> = (event) => {
            // Event source 'user' means it was a local user action
            if (event.source !== 'user') return;

            // Broadcast the changes
            // Use throttle to avoid hitting rate limits if needed, 
            // but for now we send raw for responsiveness
            channel.send({
                type: 'broadcast',
                event: 'whiteboard-update',
                payload: { changes: event.changes },
            }).catch(err => console.error('Broadcast error', err));
        };

        const cleanup = store.listen(handleChange, { source: 'user', scope: 'document' });

        return () => {
            cleanup();
        };
    }, [channel, store]);

    return store;
}
