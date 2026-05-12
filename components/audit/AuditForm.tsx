"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuditForm } from "../../hooks/useAuditForm";
import { ToolRow } from "./ToolRow";
import { ToolRowSkeleton } from "./ToolRowSkeleton";
import { Button, Spinner } from "../ui";
import type { AuditFormValues } from "../../hooks/useAuditForm";
import type { AuditResponseBody, SummaryResponseBody } from "../../types/api";

const MAX_ROWS = 10;

/**
 * Main audit form.
 *
 * Flow on submit:
 *  1. POST /api/audit        → receives auditId + recommendations
 *  2. POST /api/generate-summary → receives AI summary
 *  3. Navigate to /report/[auditId]
 */
export function AuditForm(): React.ReactElement {
  const router = useRouter();
  const { fields, append, remove, handleSubmit, formState, control } =
    useAuditForm();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = formState.isSubmitting;
  const isLoading = formState.isLoading;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAddRow(): void {
    if (fields.length < MAX_ROWS) {
      append({
        tool: "" as AuditFormValues["tools"][number]["tool"],
        plan: "" as AuditFormValues["tools"][number]["plan"],
        seats: 1,
        monthlySpend: 0,
        useCase: "",
      });
    }
  }

  const onSubmit = handleSubmit(async (values: AuditFormValues) => {
    setSubmitError(null);

    try {
      // Step 1 – run the audit
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tools: values.tools }),
      });

      if (!auditRes.ok) {
        const err = await auditRes.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Audit request failed."
        );
      }

      const auditData: AuditResponseBody = await auditRes.json();

      // Step 2 – generate AI summary
      const summaryRes = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId: auditData.auditId,
          recommendations: auditData.recommendations,
          totalMonthlySavings: auditData.totalMonthlySavings,
          totalYearlySavings: auditData.totalYearlySavings,
        }),
      });

      if (!summaryRes.ok) {
        const err = await summaryRes.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? "Summary generation failed."
        );
      }

      // Step 3 – navigate to the report page
      router.push(`/report/${auditData.auditId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  // Show skeletons while react-hook-form is hydrating from localStorage
  if (isLoading) {
    return (
      <div className="w-full space-y-6" aria-busy="true" aria-label="Loading form">
        {[0, 1].map((i) => (
          <ToolRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="AI stack audit form"
      className="w-full space-y-6"
    >
      {/* ── Tool rows ─────────────────────────────────────────────────────── */}
      <div className="space-y-8">
        {isSubmitting
          ? fields.map((_, i) => <ToolRowSkeleton key={i} />)
          : fields.map((field, index) => (
              <ToolRow
                key={field.id}
                index={index}
                control={control}
                onRemove={remove}
                isRemoveDisabled={fields.length === 1}
              />
            ))}
      </div>

      {/* ── Root-level form error (from react-hook-form) ──────────────────── */}
      {formState.errors.tools?.root?.message && (
        <p role="alert" className="text-sm text-red-600">
          {formState.errors.tools.root.message}
        </p>
      )}

      {/* ── Submission error ──────────────────────────────────────────────── */}
      {submitError && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Add tool row */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={fields.length >= MAX_ROWS || isSubmitting}
          onClick={handleAddRow}
          aria-label={
            fields.length >= MAX_ROWS
              ? `Maximum of ${MAX_ROWS} tools reached`
              : "Add another tool"
          }
        >
          + Add Tool
          {fields.length >= MAX_ROWS && (
            <span className="ml-1 text-xs text-gray-400">
              ({MAX_ROWS}/{MAX_ROWS})
            </span>
          )}
        </Button>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          aria-label={isSubmitting ? "Analysing your AI stack…" : "Analyse my AI stack"}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="shrink-0" />
              Analysing…
            </>
          ) : (
            "Analyse My AI Stack"
          )}
        </Button>
      </div>

      {/* Row count hint */}
      {fields.length > 1 && (
        <p className="text-right text-xs text-gray-400" aria-live="polite">
          {fields.length}/{MAX_ROWS} tools added
        </p>
      )}
    </form>
  );
}
