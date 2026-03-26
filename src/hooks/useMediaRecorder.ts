"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import fixWebmDuration from "fix-webm-duration";

function getSupportedMimeType(): string {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "video/webm";
}

interface UseMediaRecorderOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useMediaRecorder({ canvasRef }: UseMediaRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedAudioStreamRef = useRef<MediaStream | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = useCallback(
    (screenStream: MediaStream, webcamStream: MediaStream | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Capture the composited canvas as a stream
      const canvasStream = canvas.captureStream(30);
      canvasStreamRef.current = canvasStream;

      // Mix audio tracks using Web Audio API
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      // Add screen system audio if available
      const screenAudioTracks = screenStream.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        const screenAudioSource = audioContext.createMediaStreamSource(
          new MediaStream(screenAudioTracks)
        );
        screenAudioSource.connect(destination);
        console.log("Connected screen audio to mixer");
      }

      // Add webcam microphone audio
      if (webcamStream) {
        const micTracks = webcamStream.getAudioTracks();
        if (micTracks.length > 0) {
          const micSource = audioContext.createMediaStreamSource(
            new MediaStream(micTracks)
          );
          micSource.connect(destination);
          console.log("Connected microphone audio to mixer");
        }
      }

      // Get the mixed audio stream
      const mixedAudioStream = destination.stream;
      mixedAudioStreamRef.current = mixedAudioStream;

      // Combine canvas video + mixed audio
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...mixedAudioStream.getAudioTracks(),
      ]);

      console.log(`Combined stream - video tracks: ${combinedStream.getVideoTracks().length}, audio tracks: ${combinedStream.getAudioTracks().length}`);
      const mimeType = getSupportedMimeType();

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Close audio context
        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }
        mixedAudioStreamRef.current = null;

        const rawBlob = new Blob(chunksRef.current, { type: mimeType });
        const elapsed = Date.now() - startTimeRef.current;

        // Fix WebM duration metadata
        const fixedBlob = await fixWebmDuration(rawBlob, elapsed, { logger: false });

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(fixedBlob);
        setPreviewUrl(url);
        setRecordedBlob(fixedBlob);
      };

      recorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    },
    [canvasRef, previewUrl]
  );

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "paused") {
      recorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, []);

  const reset = useCallback(async () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    mixedAudioStreamRef.current = null;
    setPreviewUrl(null);
    setRecordedBlob(null);
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    chunksRef.current = [];
  }, [previewUrl]);

  return {
    isRecording,
    isPaused,
    duration,
    previewUrl,
    recordedBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
  };
}
