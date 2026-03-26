import { db } from "@/lib/db";
import Link from "next/link";
import { VideoList } from "@/components/dashboard/VideoList";

export default async function DashboardPage() {
  const videos = await db.video.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Your Videos</h1>
        <Link
          href="/dashboard/record"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Record New Video
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-slate-500 text-6xl mb-4">🎥</div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">
            No videos yet
          </h2>
          <p className="text-slate-500 mb-6">
            Record your first personalized video for a prospect.
          </p>
          <Link
            href="/dashboard/record"
            className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Recording
          </Link>
        </div>
      ) : (
        <VideoList initialVideos={videos} />
      )}
    </div>
  );
}
