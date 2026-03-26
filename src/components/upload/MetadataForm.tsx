"use client";

import { useState } from "react";
import type { ProspectMetadata } from "@/types";

interface MetadataFormProps {
  onSubmit: (metadata: ProspectMetadata) => void;
  loading?: boolean;
}

export function MetadataForm({ onSubmit, loading }: MetadataFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      prospectName: formData.get("prospectName") as string,
      prospectCompany: formData.get("prospectCompany") as string,
      prospectEmail: formData.get("prospectEmail") as string,
      ctaLabel: (formData.get("ctaLabel") as string) || undefined,
      ctaUrl: (formData.get("ctaUrl") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      sitePreviewUrl: (formData.get("sitePreviewUrl") as string) || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-white mb-6">Video Details</h2>

      <div>
        <label htmlFor="prospectName" className="block text-sm font-medium text-slate-300 mb-1">
          Prospect Name *
        </label>
        <input
          id="prospectName"
          name="prospectName"
          type="text"
          required
          placeholder="Jane Smith"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="prospectCompany" className="block text-sm font-medium text-slate-300 mb-1">
          Company *
        </label>
        <input
          id="prospectCompany"
          name="prospectCompany"
          type="text"
          required
          placeholder="Acme Corp"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="prospectEmail" className="block text-sm font-medium text-slate-300 mb-1">
          Email *
        </label>
        <input
          id="prospectEmail"
          name="prospectEmail"
          type="email"
          required
          placeholder="jane@acme.com"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        {showAdvanced ? "Hide" : "Show"} advanced options
      </button>

      {showAdvanced && (
        <>
          <div>
            <label htmlFor="ctaLabel" className="block text-sm font-medium text-slate-300 mb-1">
              CTA Button Label
            </label>
            <input
              id="ctaLabel"
              name="ctaLabel"
              type="text"
              placeholder="Book a Call"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="ctaUrl" className="block text-sm font-medium text-slate-300 mb-1">
              CTA URL
            </label>
            <input
              id="ctaUrl"
              name="ctaUrl"
              type="url"
              placeholder="https://calendly.com/your-link"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sitePreviewUrl" className="block text-sm font-medium text-slate-300 mb-1">
              Site Preview URL (iframe)
            </label>
            <input
              id="sitePreviewUrl"
              name="sitePreviewUrl"
              type="url"
              placeholder="https://prospect-website.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Internal notes about this prospect..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
      >
        {loading ? "Uploading..." : "Upload & Create Link"}
      </button>
    </form>
  );
}
