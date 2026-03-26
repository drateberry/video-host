"use client";

import { useState, useCallback } from "react";
import { createVideoRecord } from "@/app/dashboard/record/actions";
import type { ProspectMetadata } from "@/types";
import { generateSlug } from "@/lib/utils";

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      blob: Blob,
      metadata: ProspectMetadata
    ): Promise<{ slug: string; id: string }> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      const tempSlug = generateSlug(metadata.prospectName, metadata.prospectCompany);

      try {
        // 1. Get pre-signed URL from our API
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: blob.type, slug: tempSlug }),
        });

        if (!presignRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { url, key } = await presignRes.json();

        // 2. Upload directly to S3 via XHR for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Timeout after 2 minutes
          const timeout = setTimeout(() => {
            xhr.abort();
            reject(new Error("Upload timed out"));
          }, 120000);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            clearTimeout(timeout);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", (e) => {
            clearTimeout(timeout);
            reject(new Error("Upload failed - check S3 bucket CORS configuration"));
          });

          xhr.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("Upload aborted"));
          });

          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", blob.type);
          xhr.send(blob);
        });

        // 3. Create video record in database via server action
        const result = await createVideoRecord({
          s3Key: key,
          ...metadata,
        });

        // 4. Trigger transcoding to MP4 (fire-and-forget, video is already playable as .webm)
        fetch("/api/transcode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: result.id }),
        }).catch(() => {
          // Non-blocking: transcoding failure doesn't break the upload flow
          console.warn("Failed to trigger transcoding, video will remain as .webm");
        });

        setIsUploading(false);
        return result;
      } catch (err) {
        setIsUploading(false);
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        throw err;
      }
    },
    []
  );

  return { upload, progress, isUploading, error };
}
