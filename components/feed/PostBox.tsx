"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon, X, Loader2, Smile, Paperclip } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function PostBox({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (!supabase) {
        throw new Error("Supabase client is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { data, error } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      setMediaUrls((prev) => [...prev, publicUrl]);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Make sure the 'media' bucket exists and is public.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeMedia(url: string) {
    setMediaUrls(mediaUrls.filter((u) => u !== url));
  }

  async function handleSubmit() {
    if (!content.trim() && mediaUrls.length === 0) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content, mediaUrls }),
        headers: { "Content-Type": "application/json" }
      });
      setContent("");
      setMediaUrls([]);
      onPostCreated();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="soft-card soft-card-hover p-5 mb-5">
      <textarea
        placeholder="Share an achievement, ask a question, or post an update..."
        className="w-full bg-muted/40 rounded-xl resize-none outline-none text-sm placeholder:text-muted-foreground p-4 min-h-[90px] border border-transparent focus:border-primary/20 focus:bg-card transition-all"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* Media Previews */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 px-1 mt-3">
          {mediaUrls.map((url) => (
            <div key={url} className="relative group rounded-xl overflow-hidden border border-border shadow-sm">
              <Image src={url} alt="Uploaded media" width={100} height={100} className="object-cover h-20 w-20" />
              <button
                onClick={() => removeMedia(url)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary text-xs font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Photo
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading || (!content.trim() && mediaUrls.length === 0)}
          size="sm"
          className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Post
        </Button>
      </div>
    </div>
  );
}
