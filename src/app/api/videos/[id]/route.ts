import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteS3Object } from "@/lib/s3";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from S3
  try {
    await deleteS3Object(video.s3Key);
  } catch {
    // Continue even if S3 delete fails
  }

  // Delete from database (cascades to ViewEvents)
  await db.video.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
