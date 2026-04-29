"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Users, Search, UserPlus, Check, X, MessageSquareText,
  Loader2, UserMinus, Sparkles, Clock, Send, Inbox
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
  openToMentor?: boolean;
  similarity?: number;
};

type PendingReceived = {
  id: number;
  createdAt: string;
  sender: UserData;
};

type PendingSent = {
  id: number;
  createdAt: string;
  receiver: UserData;
};

const TABS = ["connections", "pending", "discover"] as const;
type Tab = (typeof TABS)[number];

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
];

function UserAvatar({ user, index, size = "md" }: { user: UserData; index: number; size?: "sm" | "md" }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const initials = name.split(" ").map(n => n[0]).join("");
  const sizeClass = size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";

  if (user.profile_photo) {
    return (
      <img
        src={user.profile_photo}
        alt={name}
        className={`${sizeClass} rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-inset ring-black/5`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-xl flex items-center justify-center font-bold shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]} shadow-sm ring-1 ring-inset ring-black/5`}>
      {initials}
    </div>
  );
}

export default function ConnectionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("connections");
  const [connections, setConnections] = useState<UserData[]>([]);
  const [received, setReceived] = useState<PendingReceived[]>([]);
  const [sent, setSent] = useState<PendingSent[]>([]);
  const [recommendations, setRecommendations] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // FETCH CONNECTIONS LIST
  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // FETCH PENDING REQUESTS
  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/connections/pending");
      const data = await res.json();
      setReceived(data.received || []);
      setSent(data.sent || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // FETCH RECOMMENDED USERS VIA COSINE SIMILARITY
  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch("/api/embeddings/recommend");
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchConnections(), fetchPending(), fetchRecommendations()])
      .finally(() => setLoading(false));
  }, [user, fetchConnections, fetchPending, fetchRecommendations]);

  const handleAccept = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "ACCEPTED" }),
      });
      await Promise.all([fetchConnections(), fetchPending()]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "REJECTED" }),
      });
      await fetchPending();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (targetUserId: number) => {
    setActionLoading(targetUserId);
    try {
      await fetch("/api/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      await fetchConnections();
    } finally {
      setActionLoading(null);
    }
  };

  const handleConnect = async (targetUserId: number) => {
    setActionLoading(targetUserId);
    try {
      await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      await Promise.all([fetchPending(), fetchRecommendations()]);
    } finally {
      setActionLoading(null);
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

  const filteredConnections = connections.filter(c => {
    if (!searchQuery) return true;
    const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const pendingCount = received.length + sent.length;
  const sentUserIds = new Set(sent.map(s => s.receiver.id));
  const connectedIds = new Set(connections.map(c => c.id));
  const filteredRecs = recommendations.filter(r => !connectedIds.has(r.id) && !sentUserIds.has(r.id));

  return (
    <div className="flex flex-col h-full w-full p-6 sm:p-10 overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10">
            <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Connections
          </h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 ml-1">
          Network with alumni and build meaningful relationships.
        </p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-muted/50 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {tab === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
            {tab === "connections" && connections.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/50 text-xs font-medium">
                {connections.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
        </div>
      ) : (
        <>
          {activeTab === "connections" && (
            <div className="space-y-4">
              {connections.length > 0 && (
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search connections..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                  />
                </div>
              )}

              {filteredConnections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Search className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-4">No connections yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Head to the Discover tab to find and connect with people.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredConnections.map((conn, i) => {
                    const name = [conn.firstName, conn.lastName].filter(Boolean).join(" ") || "User";
                    return (
                      <div key={conn.id} className="soft-card p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={conn} index={i} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {conn.roleTitle || conn.domain || conn.role}
                            </p>
                          </div>
                        </div>
                        {conn.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {conn.skills.slice(0, 3).map(s => (
                              <Badge key={s} variant="secondary" className="px-2 py-0 h-5 text-[9px] font-bold bg-primary/5 text-primary border-transparent">
                                {s}
                              </Badge>
                            ))}
                            {conn.skills.length > 3 && (
                              <span className="text-[9px] font-bold text-muted-foreground leading-5">+{conn.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => handleStartChat(conn.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white px-3 py-2 rounded-lg transition-all cursor-pointer"
                          >
                            <MessageSquareText className="h-3.5 w-3.5" />
                            Chat
                          </button>
                          <button
                            onClick={() => handleDisconnect(conn.id)}
                            disabled={actionLoading === conn.id}
                            className="flex items-center justify-center gap-1.5 text-xs font-bold text-destructive/70 hover:text-destructive bg-destructive/5 hover:bg-destructive/10 px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === conn.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserMinus className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "pending" && (
            <div className="space-y-6">
              {received.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                    Received Requests
                  </h3>
                  <div className="space-y-2">
                    {received.map((req, i) => {
                      const name = [req.sender.firstName, req.sender.lastName].filter(Boolean).join(" ") || "User";
                      return (
                        <div key={req.id} className="soft-card p-4 flex items-center gap-3">
                          <UserAvatar user={req.sender} index={i} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {req.sender.roleTitle || req.sender.domain || req.sender.role}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(req.id)}
                              disabled={actionLoading === req.id}
                              className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoading === req.id}
                              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive bg-muted hover:bg-destructive/10 px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {sent.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                    Sent Requests
                  </h3>
                  <div className="space-y-2">
                    {sent.map((req, i) => {
                      const name = [req.receiver.firstName, req.receiver.lastName].filter(Boolean).join(" ") || "User";
                      return (
                        <div key={req.id} className="soft-card p-4 flex items-center gap-3">
                          <UserAvatar user={req.receiver} index={i} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {req.receiver.roleTitle || req.receiver.domain || req.receiver.role}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-medium">Pending</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {received.length === 0 && sent.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-4">No pending requests</h3>
                  <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "discover" && (
            <div className="space-y-4">
              {filteredRecs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Sparkles className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-4">No recommendations yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Complete your profile to get personalized suggestions.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRecs.map((rec, i) => {
                    const name = [rec.firstName, rec.lastName].filter(Boolean).join(" ") || "User";
                    const matchPct = rec.similarity ? Math.round(rec.similarity * 100) : null;
                    return (
                      <div key={rec.id} className="soft-card p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={rec} index={i} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {rec.roleTitle || rec.domain || rec.role}
                            </p>
                          </div>
                          {matchPct && (
                            <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent shrink-0">
                              {matchPct}% match
                            </Badge>
                          )}
                        </div>
                        {rec.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rec.skills.slice(0, 4).map(s => (
                              <Badge key={s} variant="secondary" className="px-2 py-0 h-5 text-[9px] font-bold bg-primary/5 text-primary border-transparent">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => handleConnect(rec.id)}
                            disabled={actionLoading === rec.id}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === rec.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="h-3.5 w-3.5" />
                            )}
                            Connect
                          </button>
                          <Link href={`/u/${rec.clerkId}`}>
                            <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg transition-all cursor-pointer">
                              View
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
