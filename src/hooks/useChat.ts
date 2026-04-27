import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ChatChannel {
  id: string;
  type: "global" | "game" | "team";
  name: string;
  game: string | null;
  team_id: string | null;
  icon: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null };
}

const PAGE_SIZE = 50;

export function useChat() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const lastSentAt = useRef(0);
  const channelRef = useRef<any>(null);
  const activeChannelIdRef = useRef<string | null>(null);

  // Keep ref in sync
  activeChannelIdRef.current = activeChannelId;

  // Fetch channels
  useEffect(() => {
    if (!user) return;
    const fetchChannels = async () => {
      const { data } = await supabase
        .from("chat_channels")
        .select("*")
        .order("created_at");
      if (data) setChannels(data as ChatChannel[]);
    };
    fetchChannels();
  }, [user]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (!activeChannelId) return;
    setLoading(true);
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel_id", activeChannelId)
        .order("created_at", { ascending: true })
        .limit(PAGE_SIZE);
      if (data && data.length > 0) {
        // Fetch profiles for message authors
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        setMessages(
          data.map((m: any) => ({ ...m, profile: profileMap.get(m.user_id) }))
        );
      } else {
        setMessages([]);
      }
      setLoading(false);
      // Clear unread for this channel
      setUnreadCounts((prev) => ({ ...prev, [activeChannelId]: 0 }));
    };
    fetchMessages();
  }, [activeChannelId]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe to ALL chat_messages for unread tracking
    channelRef.current = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.channel_id === activeChannelIdRef.current) {
            // Fetch the profile for the new message
            supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", newMsg.user_id)
              .single()
              .then(({ data: profile }) => {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, { ...newMsg, profile: profile || undefined }];
                });
              });
          } else {
            // Increment unread
            setUnreadCounts((prev) => ({
              ...prev,
              [newMsg.channel_id]: (prev[newMsg.channel_id] || 0) + 1,
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const deleted = payload.old as any;
          if (deleted.channel_id === activeChannelIdRef.current) {
            setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !activeChannelId || !content.trim()) return;
      // Rate limit: 1 msg/sec
      const now = Date.now();
      if (now - lastSentAt.current < 1000) return;
      lastSentAt.current = now;

      const trimmed = content.trim().slice(0, 500);

      const { data, error } = await supabase.from("chat_messages").insert({
        channel_id: activeChannelId,
        user_id: user.id,
        content: trimmed,
      }).select().single();

      if (!error && data) {
        // Fetch own profile for display
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        setMessages((prev) => {
          // Avoid duplicates from realtime
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, { ...data, profile: profile || undefined }];
        });
      }
    },
    [user, activeChannelId]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      await supabase.from("chat_messages").delete().eq("id", messageId);
    },
    []
  );

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return {
    channels,
    activeChannelId,
    setActiveChannelId,
    messages,
    loading,
    sendMessage,
    deleteMessage,
    unreadCounts,
    totalUnread,
  };
}
