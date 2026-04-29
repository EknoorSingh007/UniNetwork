"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Send, Loader2, Phone, Video, MoreVertical
} from "lucide-react";
import Link from "next/link";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";

type MessageData = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  read: boolean;
  sender: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profile_photo: string | null;
  };
};

type OtherUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  profile_photo: string | null;
  clerkId: string | null;
  roleTitle: string | null;
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
];

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateDivider(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function ConversationPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const conversationId = parseInt(params.conversationId as string);

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { incomingMessages, clearMessages } = useRealtimeMessages(conversationId, currentUserId);

  // FETCH MESSAGES FOR THIS CONVERSATION
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${conversationId}/messages`);
      const data = await res.json();
      if (data.error) {
        router.push("/chats");
        return;
      }
      setMessages(data.messages || []);
      setOtherUser(data.otherUser || null);
      setCurrentUserId(data.currentUserId || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [conversationId, router]);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user, fetchMessages]);

  // POLL FOR NEW MESSAGES EVERY 3 SECONDS AS A FALLBACK
  useEffect(() => {
    if (!user || loading) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, loading, fetchMessages]);

  useEffect(() => {
    if (incomingMessages.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = incomingMessages
          .filter(m => !existingIds.has(m.id))
          .map(m => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            senderId: m.senderId,
            read: m.read,
            sender: {
              id: m.senderId,
              firstName: otherUser?.firstName || null,
              lastName: otherUser?.lastName || null,
              profile_photo: otherUser?.profile_photo || null,
            },
          }));
        return [...prev, ...newMsgs];
      });
      clearMessages();
    }
  }, [incomingMessages, clearMessages, otherUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND A MESSAGE
  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const content = inputValue.trim();
    setInputValue("");
    setSending(true);

    const optimisticMsg: MessageData = {
      id: Date.now(),
      content,
      createdAt: new Date().toISOString(),
      senderId: currentUserId!,
      read: false,
      sender: {
        id: currentUserId!,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        profile_photo: user?.imageUrl || null,
      },
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/chats/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const realMsg = await res.json();

      setMessages(prev =>
        prev.map(m => (m.id === optimisticMsg.id ? { ...realMsg } : m))
      );
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    );
  }

  const otherName = otherUser
    ? [otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ") || "User"
    : "Chat";
  const otherInitials = otherName.split(" ").map(n => n[0]).join("");

  let lastDateStr = "";

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <Link href="/chats" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        {otherUser?.profile_photo ? (
          <img
            src={otherUser.profile_photo}
            alt={otherName}
            className="h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-inset ring-black/5"
          />
        ) : (
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${AVATAR_COLORS[0]} shadow-sm ring-1 ring-inset ring-black/5`}>
            {otherInitials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{otherName}</p>
          <p className="text-[10px] text-muted-foreground font-medium truncate">
            {otherUser?.roleTitle || ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              {otherUser?.profile_photo ? (
                <img
                  src={otherUser.profile_photo}
                  alt={otherName}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <span className={`text-xl font-bold ${AVATAR_COLORS[0].split(" ").slice(1).join(" ")}`}>
                  {otherInitials}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-foreground">{otherName}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Start the conversation by sending a message.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          const msgDate = new Date(msg.createdAt).toDateString();
          let showDateDivider = false;
          if (msgDate !== lastDateStr) {
            showDateDivider = true;
            lastDateStr = msgDate;
          }

          const showAvatar =
            !isMe &&
            (i === 0 || messages[i - 1].senderId !== msg.senderId);

          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                    {formatDateDivider(msg.createdAt)}
                  </div>
                </div>
              )}
              <div className={`flex items-end gap-2 mb-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className="w-7 shrink-0">
                    {showAvatar && (
                      otherUser?.profile_photo ? (
                        <img
                          src={otherUser.profile_photo}
                          alt=""
                          className="h-7 w-7 rounded-lg object-cover"
                        />
                      ) : (
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${AVATAR_COLORS[1]}`}>
                          {otherInitials}
                        </div>
                      )
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                  <span
                    className={`block text-[9px] mt-1 ${
                      isMe ? "text-white/60 text-right" : "text-muted-foreground/60"
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
