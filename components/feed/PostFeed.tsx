"use client";

import { useEffect, useState } from "react";
import PostBox from "./PostBox";
import CommentSection from "./CommentSection";
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

type Post = {
  id: number;
  content: string;
  createdAt: string;
  author: { clerkId: string; firstName: string; lastName: string; roleTitle: string; profile_photo: string | null };
  _count: { likes: number; comments: number };
  isLiked?: boolean;
  comments?: any[];
  mediaUrls?: string[];
};

export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
        const res = await fetch("/api/posts");
        if (res.ok) {
        setPosts(await res.json());
        }
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const alreadyLiked = !!post.isLiked;

    // Optimistically update UI
    setPosts(posts.map(p => {
        if (p.id === postId) {
            return {
                ...p,
                isLiked: !alreadyLiked,
                _count: { 
                    ...p._count, 
                    likes: alreadyLiked ? Math.max(0, p._count.likes - 1) : p._count.likes + 1 
                }
            };
        }
        return p;
    }));
    
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    // fetchPosts(); // Optional: remove if you want full trust in optimistic UI
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="w-full space-y-5">
      <PostBox onPostCreated={fetchPosts} />
      
      {isLoading && posts.length === 0 && (
        <div className="soft-card p-12 text-center">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium">Loading feed...</span>
          </div>
        </div>
      )}
      
      {posts.map((post) => (
        <div key={post.id} className="soft-card soft-card-hover overflow-hidden">
          <div className="p-5">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/u/${post.author.clerkId}`} className="group/avatar shrink-0">
                <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-sm text-primary ring-2 ring-primary/10 transition-transform group-hover/avatar:scale-110 overflow-hidden">
                  {post.author.profile_photo ? (
                    <Image src={post.author.profile_photo} alt={post.author.firstName} width={40} height={40} className="object-cover w-full h-full" unoptimized/>
                  ) : (
                    <span>{post.author.firstName?.charAt(0)}{post.author.lastName?.charAt(0)}</span>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/u/${post.author.clerkId}`} className="hover:underline underline-offset-4">
                  <p className="font-semibold text-foreground text-sm">{post.author.firstName} {post.author.lastName}</p>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {post.author.roleTitle || "Student"} · {timeAgo(post.createdAt)}
                </p>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-foreground whitespace-pre-wrap mb-4 leading-relaxed">{post.content}</p>
          </div>
            
          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className={cn(
              "grid gap-0.5",
              post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
              {post.mediaUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-video bg-muted">
                  <Image 
                    src={url} 
                    alt={`Post media ${idx}`} 
                    fill 
                    className="object-cover"
                    sizes="(max-w-768px) 100vw, 50vw"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="px-5 py-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleLike(post.id)}
                className={cn(
                  "flex items-center gap-2 hover:bg-primary/5 text-xs font-semibold transition-all px-4 py-2 rounded-lg cursor-pointer",
                  post.isLiked ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <ThumbsUp className={cn("h-4 w-4", post.isLiked && "fill-primary")} /> 
                {post._count.likes > 0 ? post._count.likes : "Like"}
              </button>
              <button 
                onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                className={cn(
                  "flex items-center gap-2 hover:bg-primary/5 text-xs font-semibold transition-all px-4 py-2 rounded-lg cursor-pointer",
                  activeCommentPost === post.id ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <MessageSquare className={cn("h-4 w-4", activeCommentPost === post.id && "fill-primary/20")} /> 
                {post._count.comments > 0 ? post._count.comments : "Comment"}
              </button>
            </div>
          </div>

          {activeCommentPost === post.id && (
            <div className="px-5 pb-4">
              <CommentSection 
                  postId={post.id} 
                  initialComments={post.comments} 
                  onCommentAdded={() => {
                      setPosts(posts.map(p => p.id === post.id ? {
                          ...p,
                          _count: { ...p._count, comments: p._count.comments + 1 }
                      } : p));
                  }}
              />
            </div>
          )}
        </div>
      ))}
      {!isLoading && posts.length === 0 && (
        <div className="soft-card p-12 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            No posts yet. Be the first to share an update with your university!
          </p>
        </div>
      )}
    </div>
  );
}
