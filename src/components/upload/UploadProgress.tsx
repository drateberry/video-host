"use client";

interface UploadProgressProps {
  progress: number;
  isUploading: boolean;
}

export function UploadProgress({ progress, isUploading }: UploadProgressProps) {
  if (!isUploading) return null;

  return (
    <div className="max-w-lg mx-auto space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">Uploading video...</span>
        <span className="text-white font-mono">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
