import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  user: { clerkId: string; firstName: string; lastName: string; profile_photo: string | null; roleTitle: string };
};

export default function CommentSection({
  postId,
  initialComments = [],
  onCommentAdded,
}: {
  postId: number;
  initialComments?: Comment[];
  onCommentAdded?: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        body: JSON.stringify({ content: newComment }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment("");
        onCommentAdded?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="pt-4 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Link href={`/u/${comment.user.clerkId}`} className="group/avatar shrink-0 mt-0.5">
              <div className="h-8 w-8 rounded-full bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center font-bold text-[10px] text-primary ring-1 ring-primary/10 transition-transform group-hover/avatar:scale-110 overflow-hidden">
                {comment.user.profile_photo ? (
                  <Image src={comment.user.profile_photo} alt={comment.user.firstName} width={32} height={32} className="object-cover w-full h-full" />
                ) : (
                  <span>{comment.user.firstName?.charAt(0)}{comment.user.lastName?.charAt(0)}</span>
                )}
              </div>
            </Link>
            <div className="flex-1 space-y-1">
              <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center justify-between mb-0.5">
                  <Link href={`/u/${comment.user.clerkId}`} className="hover:underline underline-offset-4">
                    <p className="text-xs font-bold text-foreground">
                      {comment.user.firstName} {comment.user.lastName}
                    </p>
                  </Link>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {comment.content}
                </p>
              </div>
              <div className="flex items-center gap-4 px-1">
                 <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Like
                 </button>
                 <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Reply
                 </button>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-2 font-medium">
            No comments yet. Be the first to start the conversation!
          </p>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/50 focus-within:border-primary/30 focus-within:bg-card transition-all duration-300">
        <input
          placeholder="Write a thoughtful comment..."
          value={newComment}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          className="flex-1 bg-transparent outline-hidden text-sm h-9 px-3"
          disabled={isSubmitting}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className={cn(
            "h-8 w-8 rounded-lg transition-all cursor-pointer",
            newComment.trim() ? "text-primary hover:bg-primary/10" : "text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
