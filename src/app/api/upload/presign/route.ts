import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePresignedPutUrl } from "@/lib/s3";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contentType, slug } = await req.json();
  const key = `videos/${slug}/${nanoid()}.webm`;
  const url = await generatePresignedPutUrl(key, contentType);

  return NextResponse.json({ url, key });
}
