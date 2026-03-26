export type RecordingState = "idle" | "recording" | "paused" | "preview" | "metadata" | "uploading" | "done";

export interface ProspectMetadata {
  prospectName: string;
  prospectCompany: string;
  prospectEmail: string;
  ctaLabel?: string;
  ctaUrl?: string;
  notes?: string;
  sitePreviewUrl?: string;
}
