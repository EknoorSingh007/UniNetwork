"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  MessageSquareText, Inbox, Loader2, UserPlus, Search, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserData = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  roleTitle: string | null;
  company: string | null;
  domain: string | null;
  skills: string[];
  profile_photo: string | null;
  role: string;
  clerkId: string | null;
  similarity?: number;
};

type ConversationItem = {
  id: number;
  otherUser: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profile_photo: string | null;
    clerkId: string | null;
    roleTitle: string | null;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: number;
    senderName: string | null;
    read: boolean;
  } | null;
  lastMessageAt: string;
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
];

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChatsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<UserData[]>([]);
  const [connections, setConnections] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // FETCH CONVERSATIONS AND RECOMMENDATIONS ON MOUNT
  const fetchData = useCallback(async () => {
    try {
      const [chatsRes, recsRes, connsRes] = await Promise.all([
        fetch("/api/chats"),
        fetch("/api/embeddings/recommend"),
        fetch("/api/connections"),
      ]);
      const chatsData = await chatsRes.json();
      const recsData = await recsRes.json();
      const connsData = await connsRes.json();

      setConversations(chatsData.conversations || []);
      setCurrentUserId(chatsData.currentUserId || null);
      setRecommendations(recsData.recommendations || []);
      setConnections((connsData.connections || []).map((c: any) => c.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleConnect = async (targetUserId: number) => {
    setConnectLoading(targetUserId);
    try {
      await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      setRecommendations(prev => prev.filter(r => r.id !== targetUserId));
    } finally {
      setConnectLoading(null);
    }
  };

  // START OR OPEN CHAT WITH A CONNECTION
  const handleStartChat = async (targetUserId: number) => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.conversationId) {
        router.push(`/chats/${data.conversationId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const connectedIds = new Set(connections);
  const existingChatUserIds = new Set(conversations.map(c => c.otherUser?.id).filter(Boolean));
  const filteredRecs = recommendations.filter(r => !existingChatUserIds.has(r.id));

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = `${c.otherUser?.firstName || ""} ${c.otherUser?.lastName || ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto">
      <div className="p-6 sm:p-10 pb-0 sm:pb-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
            <MessageSquareText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Chats
          </h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 ml-1 mb-6">
          Your messages and conversations.
        </p>
      </div>

      {filteredRecs.length > 0 && (
        <div className="px-6 sm:px-10 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recommended for You
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {filteredRecs.map((rec, i) => {
              const name = [rec.firstName, rec.lastName].filter(Boolean).join(" ") || "User";
              const initials = name.split(" ").map(n => n[0]).join("");
              const matchPct = rec.similarity ? Math.round(rec.similarity * 100) : null;
              const isConnected = connectedIds.has(rec.id);

              return (
                <div
                  key={rec.id}
                  className="shrink-0 w-[160px] soft-card p-4 flex flex-col items-center gap-2.5 text-center hover:shadow-md transition-shadow"
                >
                  {rec.profile_photo ? (
                    <img
                      src={rec.profile_photo}
                      alt={name}
                      className="h-14 w-14 rounded-xl object-cover shadow-sm ring-1 ring-inset ring-black/5"
                    />
                  ) : (
                    <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-lg font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]} shadow-sm ring-1 ring-inset ring-black/5`}>
                      {initials}
                    </div>
                  )}
                  <div className="w-full min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {rec.roleTitle || rec.domain || rec.role}
                    </p>
                  </div>
                  {isConnected ? (
                    <button
                      onClick={() => handleStartChat(rec.id)}
                      className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-white bg-primary hover:bg-primary/90 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <MessageSquareText className="h-3 w-3" />
                      Chat
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(rec.id)}
                      disabled={connectLoading === rec.id}
                      className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-white bg-primary hover:bg-primary/90 px-2 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {connectLoading === rec.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 px-6 sm:px-10 pb-6 sm:pb-10">
        {conversations.length > 0 && (
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mt-4">No messages yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Connect with people and start a conversation.
            </p>
            <Link href="/connections">
              <button className="mt-4 flex items-center gap-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-xl transition-all cursor-pointer">
                <UserPlus className="h-4 w-4" />
                Find Connections
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conv, i) => {
              const other = conv.otherUser;
              if (!other) return null;
              const name = [other.firstName, other.lastName].filter(Boolean).join(" ") || "User";
              const initials = name.split(" ").map(n => n[0]).join("");
              const isUnread = conv.lastMessage && !conv.lastMessage.read && conv.lastMessage.senderId !== currentUserId;

              return (
                <Link key={conv.id} href={`/chats/${conv.id}`}>
                  <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-muted/50 ${isUnread ? "bg-primary/5" : ""}`}>
                    {other.profile_photo ? (
                      <img
                        src={other.profile_photo}
                        alt={name}
                        className="h-11 w-11 rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-inset ring-black/5"
                      />
                    ) : (
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]} shadow-sm ring-1 ring-inset ring-black/5`}>
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${isUnread ? "font-extrabold text-foreground" : "font-semibold text-foreground"}`}>
                          {name}
                        </p>
                        {conv.lastMessage && (
                          <span className={`text-[10px] shrink-0 ${isUnread ? "text-primary font-bold" : "text-muted-foreground"}`}>
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <p className={`text-xs truncate mt-0.5 ${isUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {conv.lastMessage.senderId === currentUserId ? "You: " : ""}
                          {conv.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 mt-0.5">No messages yet</p>
                      )}
                    </div>
                    {isUnread && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
