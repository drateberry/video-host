"use client";

import { RecordingCanvas } from "./RecordingCanvas";
import { forwardRef } from "react";

interface MediaPreviewProps {
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
  isRecording: boolean;
}

export const MediaPreview = forwardRef<HTMLCanvasElement, MediaPreviewProps>(
  function MediaPreview({ screenStream, webcamStream, isRecording }, ref) {
    return (
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {/* Always render canvas so ref is ready */}
        <RecordingCanvas
          ref={ref}
          screenStream={screenStream}
          webcamStream={webcamStream}
          isRecording={isRecording}
        />

        {/* Show placeholder overlay when not recording */}
        {!screenStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl">
            <p className="text-slate-500">
              Click &quot;Start Recording&quot; to begin screen capture
            </p>
          </div>
        )}
      </div>
    );
  }
);
