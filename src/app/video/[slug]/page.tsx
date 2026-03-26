import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/playback/VideoPlayer";
import { CTASection } from "@/components/playback/CTASection";
import { SitePreview } from "@/components/playback/SitePreview";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await db.video.findUnique({ where: { slug } });
  if (!video) return {};
  return {
    title: `Video for ${video.prospectName} | ${video.prospectCompany}`,
    description: `A personalized video message for ${video.prospectName}`,
    robots: { index: false, follow: false },
  };
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const video = await db.video.findUnique({ where: { slug } });
  if (!video) notFound();

  // Increment view count (fire-and-forget)
  db.video
    .update({
      where: { id: video.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Hey {video.prospectName}!
          </h1>
          <p className="text-slate-400 mt-2">
            A personalized message for {video.prospectCompany}
          </p>
        </div>

        {/* Video Player */}
        <VideoPlayer url={video.videoUrl} />

        {/* CTA */}
        {video.ctaUrl && (
          <CTASection label={video.ctaLabel} url={video.ctaUrl} />
        )}

        {/* Site Preview */}
        {video.sitePreviewUrl && (
          <SitePreview url={video.sitePreviewUrl} />
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-slate-600 text-xs">
          Powered by ConvergeCore
        </div>
      </div>
    </div>
  );
}
