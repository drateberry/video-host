import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timingSafeEqual } from "crypto";

/**
 * POST /api/transcode/webhook
 *
 * Receives notifications when a MediaConvert job completes.
 * This can be called by:
 * - EventBridge rule → API Gateway → this endpoint
 * - SNS HTTP subscription (from CloudWatch Events)
 * - A Lambda that processes EventBridge events and calls this endpoint
 *
 * Expected payload:
 * {
 *   secret: string,           // TRANSCODE_WEBHOOK_SECRET for authentication
 *   jobId: string,            // MediaConvert job ID
 *   status: "COMPLETE" | "ERROR",
 *   outputKey?: string,       // S3 key for the .mp4 output (on COMPLETE)
 *   errorMessage?: string     // Error details (on ERROR)
 * }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { secret, jobId, status, outputKey, errorMessage } = body;

  // Authenticate the webhook call
  const expectedSecret = process.env.TRANSCODE_WEBHOOK_SECRET;
  if (!expectedSecret || !secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const a = Buffer.from(secret);
    const b = Buffer.from(expectedSecret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the video by MediaConvert job ID
  const video = await db.video.findFirst({
    where: { mediaConvertJobId: jobId },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found for job" }, { status: 404 });
  }

  if (status === "COMPLETE" && outputKey) {
    const mp4Url = `${process.env.S3_BUCKET_URL}/${outputKey}`;

    await db.video.update({
      where: { id: video.id },
      data: {
        videoUrl: mp4Url,
        mp4S3Key: outputKey,
        transcodeStatus: "complete",
      },
    });

    return NextResponse.json({ ok: true, message: "Video updated to MP4" });
  }

  if (status === "ERROR") {
    await db.video.update({
      where: { id: video.id },
      data: {
        transcodeStatus: "error",
      },
    });

    console.error(`Transcode failed for video ${video.id}: ${errorMessage}`);
    return NextResponse.json({ ok: true, message: "Error recorded" });
  }

  return NextResponse.json({ ok: true, message: "No action taken" });
}
