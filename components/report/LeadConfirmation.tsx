"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";

export interface LeadConfirmationProps {
  reportUrl: string;
}

/**
 * LeadConfirmation
 *
 * Displays the shareable report URL as a visible, copyable link after the
 * lead form has been successfully submitted.
 *
 * Requirements: 7.5
 */
export function LeadConfirmation({
  reportUrl,
}: LeadConfirmationProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text in the input so the user can copy manually
      const input = document.getElementById("report-url-input") as HTMLInputElement | null;
      input?.select();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md bg-green-50 border border-green-200 p-4">
        <p className="text-sm font-medium text-green-800">
          Your report is ready! Bookmark or share the link below.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="report-url-input"
          className="text-sm font-medium text-gray-700"
        >
          Your shareable report URL
        </label>

        <div className="flex items-center gap-2">
          {/* Visible, selectable URL */}
          <input
            id="report-url-input"
            type="url"
            readOnly
            value={reportUrl}
            aria-label="Shareable report URL"
            className="flex-1 block rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            onFocus={(e) => e.currentTarget.select()}
          />

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleCopy}
            aria-label={copied ? "Copied!" : "Copy report URL to clipboard"}
            className="shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        {/* Also render as a clickable anchor so the URL is always accessible */}
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline break-all mt-1"
        >
          {reportUrl}
        </a>
      </div>
    </div>
  );
}
