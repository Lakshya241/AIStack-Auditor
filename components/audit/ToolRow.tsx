"use client";

import React, { useId } from "react";
import { useController } from "react-hook-form";
import type { Control } from "react-hook-form";
import { Button, Input, Select } from "../ui";
import type { SelectOption } from "../ui";
import { PRICING_DATA } from "../../lib/constants/pricingData";
import type { AuditFormValues } from "../../hooks/useAuditForm";
import type { ToolName } from "../../types/tool";

export interface ToolRowProps {
  index: number;
  control: Control<AuditFormValues>;
  onRemove: (index: number) => void;
  isRemoveDisabled: boolean;
}

/** All supported tool names, sourced from PRICING_DATA to stay in sync. */
const TOOL_OPTIONS: SelectOption[] = [
  { value: "", label: "Select a tool…" },
  ...PRICING_DATA.map((entry) => ({
    value: entry.tool,
    label: entry.tool,
  })),
];

/** Placeholder option shown when no tool is selected yet. */
const PLAN_PLACEHOLDER: SelectOption = { value: "", label: "Select a plan…" };

/**
 * Returns the plan options for a given tool name.
 * Returns an empty array if the tool is not found in PRICING_DATA.
 */
function getPlanOptions(toolName: string): SelectOption[] {
  if (!toolName) return [];
  const entry = PRICING_DATA.find((d) => d.tool === toolName);
  if (!entry) return [];
  return entry.plans.map((p) => ({ value: p.name, label: p.name }));
}

export function ToolRow({
  index,
  control,
  onRemove,
  isRemoveDisabled,
}: ToolRowProps): React.ReactElement {
  const rowId = useId();

  // ── Tool field ──────────────────────────────────────────────────────────────
  const {
    field: toolField,
    fieldState: { error: toolError },
  } = useController({
    control,
    name: `tools.${index}.tool`,
  });

  // ── Plan field ──────────────────────────────────────────────────────────────
  const {
    field: planField,
    fieldState: { error: planError },
  } = useController({
    control,
    name: `tools.${index}.plan`,
  });

  // ── Seats field ─────────────────────────────────────────────────────────────
  const {
    field: seatsField,
    fieldState: { error: seatsError },
  } = useController({
    control,
    name: `tools.${index}.seats`,
  });

  // ── Monthly spend field ──────────────────────────────────────────────────────
  const {
    field: spendField,
    fieldState: { error: spendError },
  } = useController({
    control,
    name: `tools.${index}.monthlySpend`,
  });

  // ── Use case field ───────────────────────────────────────────────────────────
  const {
    field: useCaseField,
    fieldState: { error: useCaseError },
  } = useController({
    control,
    name: `tools.${index}.useCase`,
  });

  // Derive plan options and "no plans" error from the currently selected tool
  const selectedTool = toolField.value as string;
  const planOptions = getPlanOptions(selectedTool);
  const toolHasNoPlans =
    selectedTool !== "" && planOptions.length === 0;

  // When the tool changes, reset the plan to empty
  function handleToolChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    toolField.onChange(e);
    planField.onChange({ target: { value: "" } });
  }

  // IDs for accessibility
  const useCaseId = `${rowId}-use-case`;
  const useCaseErrorId = `${rowId}-use-case-error`;
  const useCaseCharCountId = `${rowId}-use-case-char-count`;
  const useCaseCharCount = (useCaseField.value as string | undefined)?.length ?? 0;

  return (
    <div
      role="group"
      aria-label={`Tool entry ${index + 1}`}
      className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* Row number badge */}
      <span
        aria-hidden="true"
        className="absolute -top-3 left-4 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white"
      >
        {index + 1}
      </span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* ── Tool name ─────────────────────────────────────────────────── */}
        <Select
          label="Tool"
          options={TOOL_OPTIONS}
          value={toolField.value as string}
          onChange={handleToolChange}
          onBlur={toolField.onBlur}
          name={toolField.name}
          ref={toolField.ref}
          error={
            toolHasNoPlans
              ? "No plans available for this tool."
              : toolError?.message
          }
          aria-required="true"
        />

        {/* ── Plan ──────────────────────────────────────────────────────── */}
        <Select
          label="Plan"
          options={
            planOptions.length > 0
              ? [PLAN_PLACEHOLDER, ...planOptions]
              : [PLAN_PLACEHOLDER]
          }
          value={planField.value as string}
          onChange={planField.onChange}
          onBlur={planField.onBlur}
          name={planField.name}
          ref={planField.ref}
          disabled={planOptions.length === 0}
          error={planError?.message}
          aria-required="true"
        />

        {/* ── Seats ─────────────────────────────────────────────────────── */}
        <Input
          label="Seats"
          type="number"
          min={1}
          max={10000}
          step={1}
          value={seatsField.value as number}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            seatsField.onChange(isNaN(parsed) ? "" : parsed);
          }}
          onBlur={seatsField.onBlur}
          name={seatsField.name}
          ref={seatsField.ref}
          error={seatsError?.message}
          aria-required="true"
        />

        {/* ── Monthly spend ─────────────────────────────────────────────── */}
        <Input
          label="Monthly Spend (USD)"
          type="number"
          min={0}
          max={1000000}
          step={0.01}
          value={spendField.value as number}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            spendField.onChange(isNaN(parsed) ? "" : parsed);
          }}
          onBlur={spendField.onBlur}
          name={spendField.name}
          ref={spendField.ref}
          error={spendError?.message}
          aria-required="true"
        />

        {/* ── Use case (spans full width on larger screens) ─────────────── */}
        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
          <label
            htmlFor={useCaseId}
            className="text-sm font-medium text-gray-700"
          >
            Use Case{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id={useCaseId}
            name={useCaseField.name}
            ref={useCaseField.ref}
            value={(useCaseField.value as string | undefined) ?? ""}
            onChange={useCaseField.onChange}
            onBlur={useCaseField.onBlur}
            maxLength={500}
            rows={2}
            aria-describedby={
              [
                useCaseError ? useCaseErrorId : null,
                useCaseCharCountId,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={useCaseError ? true : undefined}
            placeholder="Describe how your team uses this tool…"
            className={[
              "block w-full resize-none rounded-md border px-3 py-2 text-sm text-gray-900",
              "placeholder:text-gray-400",
              "transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              useCaseError
                ? "border-red-500 focus-visible:ring-red-500"
                : "border-gray-300 focus-visible:ring-blue-500",
              "bg-white",
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <div className="flex items-start justify-between gap-2">
            {useCaseError ? (
              <p
                id={useCaseErrorId}
                role="alert"
                className="text-xs text-red-600"
              >
                {useCaseError.message}
              </p>
            ) : (
              <span />
            )}
            <p
              id={useCaseCharCountId}
              aria-live="polite"
              className={[
                "ml-auto shrink-0 text-xs",
                useCaseCharCount >= 500 ? "text-red-600" : "text-gray-400",
              ].join(" ")}
            >
              {useCaseCharCount}/500
            </p>
          </div>
        </div>
      </div>

      {/* ── Remove button ─────────────────────────────────────────────────── */}
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isRemoveDisabled}
          onClick={() => onRemove(index)}
          aria-label={`Remove tool entry ${index + 1}`}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
