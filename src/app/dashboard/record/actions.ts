"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

interface CreateVideoInput {
  s3Key: string;
  prospectName: string;
  prospectCompany: string;
  prospectEmail: string;
  ctaLabel?: string;
  ctaUrl?: string;
  notes?: string;
  sitePreviewUrl?: string;
}

export async function createVideoRecord(input: CreateVideoInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const slug = generateSlug(input.prospectName, input.prospectCompany);
  const videoUrl = `${process.env.S3_BUCKET_URL}/${input.s3Key}`;

  const video = await db.video.create({
    data: {
      slug,
      s3Key: input.s3Key,
      videoUrl,
      prospectName: input.prospectName,
      prospectCompany: input.prospectCompany,
      prospectEmail: input.prospectEmail,
      ctaLabel: input.ctaLabel || "Book a Call",
      ctaUrl: input.ctaUrl,
      notes: input.notes,
      sitePreviewUrl: input.sitePreviewUrl,
      status: "ready",
    },
  });

  return { slug: video.slug, id: video.id };
}
