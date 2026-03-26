"use client";

interface SitePreviewProps {
  url: string;
}

export function SitePreview({ url }: SitePreviewProps) {
  return (
    <div className="mt-12">
      <h2 className="text-lg font-semibold text-white mb-4">
        Your Website Preview
      </h2>
      <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
        <iframe
          src={url}
          className="w-full h-[600px]"
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
          title="Site Preview"
        />
      </div>
    </div>
  );
}
