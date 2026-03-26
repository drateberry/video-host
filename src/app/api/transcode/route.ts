import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTranscodeJob } from "@/lib/mediaconvert";

/**
 * POST /api/transcode
 * Triggers a MediaConvert transcoding job for a video.
 * Called automatically after video upload completes.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await req.json();

  const video = await db.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.transcodeStatus !== "pending") {
    return NextResponse.json({ error: "Transcoding already initiated" }, { status: 400 });
  }

  try {
    const jobId = await createTranscodeJob(video.s3Key);

    await db.video.update({
      where: { id: videoId },
      data: {
        mediaConvertJobId: jobId,
        transcodeStatus: "processing",
      },
    });

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("Failed to create transcode job:", err);

    await db.video.update({
      where: { id: videoId },
      data: { transcodeStatus: "error" },
    });

    return NextResponse.json(
      { error: "Failed to start transcoding" },
      { status: 500 }
    );
  }
}
