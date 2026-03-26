"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { useUpload } from "@/hooks/useUpload";
import { MediaPreview } from "@/components/recorder/MediaPreview";
import { RecordingControls } from "@/components/recorder/RecordingControls";
import { VideoPreview } from "@/components/recorder/VideoPreview";
import { MetadataForm } from "@/components/upload/MetadataForm";
import { UploadProgress } from "@/components/upload/UploadProgress";
import type { RecordingState, ProspectMetadata } from "@/types";
import Link from "next/link";

export default function RecordPage() {
  const [state, setState] = useState<RecordingState>("idle");
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [resultSlug, setResultSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { screenStream, startScreenCapture, stopScreenCapture, error: screenError } = useScreenCapture();
  const recorder = useMediaRecorder({ canvasRef });
  const uploader = useUpload();

  const handleStartRecording = useCallback(async () => {
    setError(null);

    // Start screen capture
    const screen = await startScreenCapture();
    if (!screen) return;

    // Log screen audio availability
    const screenAudio = screen.getAudioTracks();
    console.log(`Screen capture audio tracks: ${screenAudio.length}`);
    if (screenAudio.length === 0) {
      console.warn("No system audio captured - make sure to select 'Share audio' in the browser dialog");
    }

    // Start webcam
    let webcam: MediaStream | null = null;
    try {
      webcam = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: "user" },
        audio: true,
      });
      setWebcamStream(webcam);

      // Log webcam audio availability
      const micAudio = webcam.getAudioTracks();
      console.log(`Webcam audio tracks: ${micAudio.length}`);
    } catch (err) {
      // Webcam optional - continue without it
      console.warn("Webcam/microphone not available:", err);
    }

    // Set state to "recording" first so the canvas renders
    setState("recording");

    // Wait for canvas to render and animation to start
    await new Promise((r) => setTimeout(r, 500));

    // Verify canvas is ready
    if (!canvasRef.current) {
      setError("Canvas failed to initialize. Please try again.");
      setState("idle");
      return;
    }

    recorder.startRecording(screen, webcam);
  }, [startScreenCapture, recorder]);

  const handleStopRecording = useCallback(() => {
    recorder.stopRecording();
    stopScreenCapture();
    if (webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
    }
    setState("preview");
  }, [recorder, stopScreenCapture, webcamStream]);

  const handleReRecord = useCallback(() => {
    recorder.reset();
    setState("idle");
  }, [recorder]);

  const handleContinue = useCallback(() => {
    setState("metadata");
  }, []);

  const handleMetadataSubmit = useCallback(
    async (metadata: ProspectMetadata) => {
      if (!recorder.recordedBlob) return;

      setState("uploading");
      try {
        const result = await uploader.upload(recorder.recordedBlob, metadata);
        setResultSlug(result.slug);
        setState("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setState("metadata");
      }
    },
    [recorder.recordedBlob, uploader]
  );

  const displayError = error || screenError;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">New Recording</h1>

      {displayError && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {displayError}
        </div>
      )}

      {/* Idle state */}
      {state === "idle" && (
        <div className="space-y-6">
          {mounted && (
            <div className="bg-blue-900/30 border border-blue-700/50 text-blue-200 px-4 py-3 rounded-lg text-sm">
              <strong>Audio tip:</strong> When the browser asks to share your screen, make sure to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Check the &quot;Share audio&quot; or &quot;Share tab audio&quot; checkbox for system audio</li>
                <li>Allow microphone access when prompted for voiceover</li>
              </ul>
            </div>
          )}
          <MediaPreview
            ref={canvasRef}
            screenStream={null}
            webcamStream={null}
            isRecording={false}
          />
          <div className="flex justify-center">
            <RecordingControls
              isRecording={false}
              isPaused={false}
              duration={0}
              onStart={handleStartRecording}
              onStop={() => {}}
              onPause={() => {}}
              onResume={() => {}}
            />
          </div>
        </div>
      )}

      {/* Recording state */}
      {(state === "recording" || state === "paused") && (
        <div className="space-y-6">
          <MediaPreview
            ref={canvasRef}
            screenStream={screenStream}
            webcamStream={webcamStream}
            isRecording={recorder.isRecording}
          />
          <div className="flex justify-center">
            <RecordingControls
              isRecording={recorder.isRecording}
              isPaused={recorder.isPaused}
              duration={recorder.duration}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onPause={recorder.pauseRecording}
              onResume={recorder.resumeRecording}
            />
          </div>
        </div>
      )}

      {/* Preview state */}
      {state === "preview" && recorder.previewUrl && (
        <VideoPreview
          url={recorder.previewUrl}
          onReRecord={handleReRecord}
          onContinue={handleContinue}
        />
      )}

      {/* Metadata form */}
      {state === "metadata" && (
        <MetadataForm onSubmit={handleMetadataSubmit} />
      )}

      {/* Uploading state */}
      {state === "uploading" && (
        <UploadProgress progress={uploader.progress} isUploading={uploader.isUploading} />
      )}

      {/* Done state */}
      {state === "done" && resultSlug && (
        <div className="text-center py-12 space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-semibold text-white">Video uploaded!</h2>
          <p className="text-slate-400">Your personalized video link is ready to share.</p>
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 max-w-md mx-auto">
            <code className="text-blue-400 text-sm break-all">
              {process.env.NEXT_PUBLIC_APP_URL}/video/{resultSlug}
            </code>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_APP_URL}/video/${resultSlug}`
                );
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Copy Link
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
