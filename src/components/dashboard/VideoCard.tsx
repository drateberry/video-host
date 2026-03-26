"use client";

import type { Video } from "@/generated/prisma/client";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

export function VideoCard({ video, onDelete }: { video: Video; onDelete?: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const videoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/video/${video.slug}`;

  async function copyLink() {
    await navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
      <div className="aspect-video bg-slate-900 flex items-center justify-center">
        <span className="text-4xl">🎬</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{video.prospectName}</h3>
        <p className="text-slate-400 text-sm truncate">{video.prospectCompany}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
          <span>{video.viewCount} views</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={copyLink}
            className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            View
          </a>
          {onDelete && (
            <button
              onClick={async () => {
                if (!confirm("Delete this video?")) return;
                setDeleting(true);
                try {
                  await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
                  onDelete(video.id);
                } catch {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? "..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
