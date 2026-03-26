"use client";

import { formatDuration } from "@/lib/utils";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function RecordingControls({
  isRecording,
  isPaused,
  duration,
  onStart,
  onStop,
  onPause,
  onResume,
}: RecordingControlsProps) {
  if (!isRecording) {
    return (
      <button
        onClick={onStart}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-colors shadow-lg"
      >
        <span className="w-3 h-3 rounded-full bg-white" />
        Start Recording
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Recording indicator + timer */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full">
        <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`} />
        <span className="text-white font-mono text-sm">{formatDuration(duration)}</span>
      </div>

      {/* Pause / Resume */}
      {isPaused ? (
        <button
          onClick={onResume}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
        >
          Resume
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-full transition-colors"
        >
          Pause
        </button>
      )}

      {/* Stop */}
      <button
        onClick={onStop}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-white" />
        Stop
      </button>
    </div>
  );
}
