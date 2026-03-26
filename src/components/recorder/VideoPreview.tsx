"use client";

interface VideoPreviewProps {
  url: string;
  onReRecord: () => void;
  onContinue: () => void;
}

export function VideoPreview({ url, onReRecord, onContinue }: VideoPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <video
          src={url}
          controls
          className="w-full h-full"
          playsInline
        />
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onReRecord}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
        >
          Re-record
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
