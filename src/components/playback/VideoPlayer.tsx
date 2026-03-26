"use client";

import ReactPlayer from "react-player";

interface VideoPlayerProps {
  url: string;
}

export function VideoPlayer({ url }: VideoPlayerProps) {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
      <ReactPlayer
        src={url}
        width="100%"
        height="100%"
        controls
        playing={false}
      />
    </div>
  );
}
