"use client";

import { useState } from "react";
import { VideoCard } from "./VideoCard";
import type { Video } from "@/generated/prisma/client";

export function VideoList({ initialVideos }: { initialVideos: Video[] }) {
  const [videos, setVideos] = useState(initialVideos);

  function handleDelete(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onDelete={handleDelete} />
      ))}
    </div>
  );
}
