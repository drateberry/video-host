import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJobStatus } from "@/lib/mediaconvert";

/**
 * POST /api/transcode/check
 *
 * Fallback endpoint to manually poll MediaConvert job status.
 * Checks all videos with transcodeStatus = "processing" and updates
 * any that have completed or errored.
 *
 * Can be called:
 * - Manually from the dashboard
 * - Via a cron job (e.g. Vercel cron, external scheduler)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processingVideos = await db.video.findMany({
    where: { transcodeStatus: "processing" },
  });

  const results = [];

  for (const video of processingVideos) {
    if (!video.mediaConvertJobId) continue;

    try {
      const jobResult = await getJobStatus(video.mediaConvertJobId);

      if (jobResult.status === "COMPLETE" && jobResult.outputKey) {
        const mp4Url = `${process.env.S3_BUCKET_URL}/${jobResult.outputKey}`;

        await db.video.update({
          where: { id: video.id },
          data: {
            videoUrl: mp4Url,
            mp4S3Key: jobResult.outputKey,
            transcodeStatus: "complete",
          },
        });

        results.push({ id: video.id, slug: video.slug, status: "complete" });
      } else if (jobResult.status === "ERROR") {
        await db.video.update({
          where: { id: video.id },
          data: { transcodeStatus: "error" },
        });

        results.push({
          id: video.id,
          slug: video.slug,
          status: "error",
          error: jobResult.errorMessage,
        });
      } else {
        results.push({
          id: video.id,
          slug: video.slug,
          status: jobResult.status.toLowerCase(),
        });
      }
    } catch (err) {
      results.push({
        id: video.id,
        slug: video.slug,
        status: "check_failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ checked: processingVideos.length, results });
}
