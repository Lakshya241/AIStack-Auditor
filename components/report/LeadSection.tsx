"use client";

import React, { useState } from "react";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { LeadConfirmation } from "./LeadConfirmation";

export interface LeadSectionProps {
  auditId: string;
}

/**
 * LeadSection
 *
 * Client component that manages the transition between the lead capture
 * form and the post-submission confirmation state.
 *
 * Requirements: 7.1, 7.5
 */
export function LeadSection({ auditId }: LeadSectionProps): React.ReactElement {
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  if (reportUrl !== null) {
    return <LeadConfirmation reportUrl={reportUrl} />;
  }

  return <LeadCaptureForm auditId={auditId} onSuccess={setReportUrl} />;
}
