import { useEffect, useRef, useState, useCallback } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

type FormattedMessage = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  read: boolean;
};

// SUBSCRIBE TO SUPABASE REALTIME FOR NEW MESSAGES IN A CONVERSATION
export function useRealtimeMessages(conversationId: number | null, currentUserId: number | null) {
  const [incomingMessages, setIncomingMessages] = useState<FormattedMessage[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const clearMessages = useCallback(() => {
    setIncomingMessages([]);
  }, []);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const client = createClient(supabaseUrl, supabaseKey);

    const channel = client
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, any>;
          const senderId = raw.senderId ?? raw.sender_id;
          if (senderId === currentUserId) return;

          const msg: FormattedMessage = {
            id: raw.id,
            content: raw.content,
            createdAt: raw.createdAt ?? raw.created_at,
            senderId: senderId,
            read: raw.read ?? false,
          };

          setIncomingMessages(prev => [...prev, msg]);
        }
      )
      .subscribe((status) => {
        console.log(`Realtime channel status: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId]);

  return { incomingMessages, clearMessages };
}
