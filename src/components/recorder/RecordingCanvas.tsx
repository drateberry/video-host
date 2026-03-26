"use client";

import { useEffect, useRef, forwardRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImageSegmenter = any;

interface RecordingCanvasProps {
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
  isRecording: boolean;
}

export const RecordingCanvas = forwardRef<HTMLCanvasElement, RecordingCanvasProps>(
  function RecordingCanvas({ screenStream, webcamStream, isRecording }, ref) {
    const screenVideoRef = useRef<HTMLVideoElement | null>(null);
    const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
    const animationRef = useRef<number>(0);
    const segmenterRef = useRef<ImageSegmenter | null>(null);
    const webcamCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [segmentationReady, setSegmentationReady] = useState(false);

    // Set up hidden video elements for streams
    useEffect(() => {
      if (!screenVideoRef.current) {
        screenVideoRef.current = document.createElement("video");
        screenVideoRef.current.muted = true;
        screenVideoRef.current.playsInline = true;
      }
      if (screenStream) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.play().catch(() => {});
      }
    }, [screenStream]);

    useEffect(() => {
      if (!webcamVideoRef.current) {
        webcamVideoRef.current = document.createElement("video");
        webcamVideoRef.current.muted = true;
        webcamVideoRef.current.playsInline = true;
      }
      if (webcamStream) {
        webcamVideoRef.current.srcObject = webcamStream;
        webcamVideoRef.current.play().catch(() => {});
      }
    }, [webcamStream]);

    // Initialize MediaPipe Image Segmenter (dynamic import to avoid SSR issues)
    useEffect(() => {
      if (!webcamStream) return;

      let mounted = true;

      async function loadSegmenter() {
        try {
          // Dynamic import to avoid SSR/bundler issues
          const vision = await import("@mediapipe/tasks-vision");
          const { ImageSegmenter, FilesetResolver } = vision;

          const wasmFileset = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );

          const segmenter = await ImageSegmenter.createFromOptions(wasmFileset, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            outputCategoryMask: true,
          });

          if (mounted) {
            segmenterRef.current = segmenter;
            setSegmentationReady(true);
            console.log("Background blur model loaded (MediaPipe Tasks Vision)");
          } else {
            segmenter.close();
          }
        } catch (err) {
          console.error("Failed to load segmentation model:", err);
        }
      }

      // Create canvas for webcam processing
      if (!webcamCanvasRef.current) {
        webcamCanvasRef.current = document.createElement("canvas");
      }

      loadSegmenter();

      return () => {
        mounted = false;
        if (segmenterRef.current) {
          segmenterRef.current.close();
          segmenterRef.current = null;
        }
        setSegmentationReady(false);
      };
    }, [webcamStream]);

    // Process webcam frames through segmentation
    useEffect(() => {
      if (!segmentationReady || !webcamVideoRef.current || !segmenterRef.current || !webcamCanvasRef.current) return;

      let processing = false;
      let active = true;
      let lastTimestamp = -1;

      function processFrame() {
        if (!active || !webcamVideoRef.current || !segmenterRef.current || !webcamCanvasRef.current || processing) {
          if (active) {
            requestAnimationFrame(processFrame);
          }
          return;
        }

        if (webcamVideoRef.current.readyState >= 2) {
          processing = true;

          try {
            const video = webcamVideoRef.current;
            const canvas = webcamCanvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              processing = false;
              return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Ensure unique timestamp for segmentForVideo
            let timestamp = performance.now();
            if (timestamp <= lastTimestamp) {
              timestamp = lastTimestamp + 1;
            }
            lastTimestamp = timestamp;

            // Run segmentation synchronously (callback-based API)
            segmenterRef.current.segmentForVideo(video, timestamp, (result: {
              categoryMask?: { getAsUint8Array: () => Uint8Array; close: () => void };
            }) => {
              if (!result || !result.categoryMask || !ctx || !canvas) {
                processing = false;
                return;
              }

              const maskData = result.categoryMask.getAsUint8Array();

              // Draw sharp original
              ctx.filter = "none";
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const sharpData = ctx.getImageData(0, 0, canvas.width, canvas.height);

              // Draw heavily blurred version
              ctx.filter = "blur(40px)";
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              ctx.filter = "none";
              const blurredData = ctx.getImageData(0, 0, canvas.width, canvas.height);

              // Composite: person pixels use sharp, background uses blurred
              const finalData = ctx.createImageData(canvas.width, canvas.height);
              for (let i = 0; i < maskData.length; i++) {
                const pi = i * 4;
                // selfie_segmenter: 0 = person (foreground), 1+ = background
                if (maskData[i] === 0) {
                  // Person - sharp and clear
                  finalData.data[pi] = sharpData.data[pi];
                  finalData.data[pi + 1] = sharpData.data[pi + 1];
                  finalData.data[pi + 2] = sharpData.data[pi + 2];
                  finalData.data[pi + 3] = 255;
                } else {
                  // Background - heavily blurred
                  finalData.data[pi] = blurredData.data[pi];
                  finalData.data[pi + 1] = blurredData.data[pi + 1];
                  finalData.data[pi + 2] = blurredData.data[pi + 2];
                  finalData.data[pi + 3] = 255;
                }
              }

              ctx.putImageData(finalData, 0, 0);
              result.categoryMask.close();
              processing = false;
            });
          } catch (err) {
            console.error("Segmentation error:", err);
            processing = false;
          }
        }

        // Process at ~15fps to reduce CPU usage
        if (active) {
          setTimeout(() => requestAnimationFrame(processFrame), 66);
        }
      }

      processFrame();

      return () => {
        active = false;
      };
    }, [segmentationReady]);

    // Canvas drawing loop
    useEffect(() => {
      const canvas = typeof ref === "function" ? null : ref?.current;
      if (!canvas || !screenStream) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas dimensions to match screen capture
      const screenTrack = screenStream.getVideoTracks()[0];
      const settings = screenTrack.getSettings();
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;

      const webcamSize = 180;
      const webcamPadding = 24;

      function draw() {
        if (!ctx || !canvas) return;

        // Draw screen capture as background
        if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
          ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
        }

        // Draw webcam with background blur as circular PiP in bottom-right
        if (webcamStream && webcamCanvasRef.current && webcamCanvasRef.current.width > 0) {
          const x = canvas.width - webcamSize - webcamPadding;
          const y = canvas.height - webcamSize - webcamPadding;
          const centerX = x + webcamSize / 2;
          const centerY = y + webcamSize / 2;
          const radius = webcamSize / 2;

          ctx.save();

          // Circular clip
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Draw the processed webcam (with background blur)
          const videoWidth = webcamCanvasRef.current.width;
          const videoHeight = webcamCanvasRef.current.height;
          const scale = Math.max(webcamSize / videoWidth, webcamSize / videoHeight);
          const drawWidth = videoWidth * scale;
          const drawHeight = videoHeight * scale;
          const offsetX = centerX - drawWidth / 2;
          const offsetY = centerY - drawHeight / 2;

          // Mirror the webcam
          ctx.translate(centerX, 0);
          ctx.scale(-1, 1);
          ctx.translate(-centerX, 0);

          ctx.drawImage(webcamCanvasRef.current, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();

          // Draw border ring around webcam
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        animationRef.current = requestAnimationFrame(draw);
      }

      draw();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [ref, screenStream, webcamStream]);

    return (
      <canvas
        ref={ref}
        className="w-full h-full rounded-lg bg-black"
        style={{ objectFit: "contain" }}
      />
    );
  }
);
