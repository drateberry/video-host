"use client";

import { useState, useCallback, useRef } from "react";

export function useScreenCapture() {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScreenCapture = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: true,
      });

      // Handle user stopping screen share via browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setScreenStream(null);
        streamRef.current = null;
      });

      streamRef.current = stream;
      setScreenStream(stream);
      return stream;
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Screen sharing was denied. Please allow screen capture to record.");
        } else if (err.name === "NotFoundError") {
          setError("No screen capture source found.");
        } else {
          setError(`Screen capture error: ${err.message}`);
        }
      } else {
        setError("Failed to start screen capture.");
      }
      return null;
    }
  }, []);

  const stopScreenCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setScreenStream(null);
    }
  }, []);

  return { screenStream, startScreenCapture, stopScreenCapture, error };
}
