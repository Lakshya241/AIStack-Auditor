"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadInput } from "../../lib/schemas/leadSchema";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import type { LeadResponseBody, ApiErrorResponse } from "../../types/api";

export interface LeadCaptureFormProps {
  auditId: string;
  onSuccess: (reportUrl: string) => void;
}

const ROLE_OPTIONS = [
  { value: "", label: "Select your role…" },
  { value: "Engineering", label: "Engineering" },
  { value: "Product", label: "Product" },
  { value: "Design", label: "Design" },
  { value: "Data / ML", label: "Data / ML" },
  { value: "Finance", label: "Finance" },
  { value: "Operations", label: "Operations" },
  { value: "Marketing", label: "Marketing" },
  { value: "Sales", label: "Sales" },
  { value: "Other", label: "Other" },
];

const TEAM_SIZE_OPTIONS = [
  { value: "", label: "Select team size…" },
  { value: "1", label: "1 (just me)" },
  { value: "5", label: "2–10" },
  { value: "25", label: "11–50" },
  { value: "100", label: "51–200" },
  { value: "500", label: "201–1000" },
  { value: "2500", label: "1001–5000" },
  { value: "10000", label: "5001–10,000" },
];

/**
 * LeadCaptureForm
 *
 * Collects email, company, role, and team size from the user before
 * revealing the shareable report URL. Validates with Zod via React Hook
 * Form and posts to POST /api/leads.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8
 */
export function LeadCaptureForm({
  auditId,
  onSuccess,
}: LeadCaptureFormProps): React.ReactElement {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      auditId,
      email: "",
      company: "",
      role: "",
      teamSize: 1,
    },
  });

  const onSubmit = async (data: LeadInput) => {
    setServerError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Req 7.6: Show a generic error message on Supabase failure;
        // do NOT surface email (Resend) failures to the user.
        const errorBody: ApiErrorResponse = await response.json().catch(() => ({
          message: "Something went wrong. Please try again.",
        }));
        setServerError(errorBody.message ?? "Something went wrong. Please try again.");
        return;
      }

      const body: LeadResponseBody = await response.json();
      // Req 7.5: Hand the report URL back to the parent
      onSuccess(body.reportUrl);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Get your report"
      className="flex flex-col gap-4"
    >
      {/* Hidden auditId — not rendered to the user */}
      <input type="hidden" {...register("auditId")} />

      {/* Req 7.1: Email — RFC 5322 validated by Zod */}
      <Input
        label="Work email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        error={errors.email?.message}
        {...register("email")}
      />

      {/* Req 7.3: Company */}
      <Input
        label="Company"
        type="text"
        autoComplete="organization"
        placeholder="Acme Corp"
        error={errors.company?.message}
        {...register("company")}
      />

      {/* Req 7.3: Role */}
      <Select
        label="Your role"
        options={ROLE_OPTIONS}
        error={errors.role?.message}
        {...register("role")}
      />

      {/* Req 7.3: Team size (1–10,000) */}
      <Select
        label="Team size"
        options={TEAM_SIZE_OPTIONS}
        error={errors.teamSize?.message}
        {...register("teamSize", { valueAsNumber: true })}
      />

      {/* Req 7.6: Server-side / Supabase error */}
      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full mt-2"
      >
        Get my free report
      </Button>
    </form>
  );
}
