# Implementation Plan: AIStack Auditor

## Overview

Implement AIStack Auditor as a Next.js 14 (App Router) SaaS MVP with TypeScript strict mode. The implementation proceeds in layers: types and pricing data first, then the pure audit engine and its tests, then API routes and Supabase/Resend integrations, then UI components, and finally the landing page and report page wiring.

## Tasks

- [x] 1. Project scaffolding and type definitions
  - [x] 1.1 Initialize Next.js 14 project with TypeScript strict mode and install all dependencies
    - Run `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router, and `src/` disabled
    - Install: `@supabase/supabase-js`, `@anthropic-ai/sdk`, `resend`, `react-hook-form`, `@hookform/resolvers`, `zod`, `uuid`, `fast-check`, `vitest`, `@vitejs/plugin-react`
    - Confirm `tsconfig.json` has `"strict": true`
    - Create the exact top-level folder structure: `app/`, `components/`, `lib/`, `hooks/`, `tests/`, `types/`, `public/`
    - _Requirements: 13.1, 13.5_

  - [x] 1.2 Define all domain types in `types/`
    - Create `types/tool.ts` with `ToolName`, `PlanName`, `ToolEntry`, `PricingPlan`, `ToolPricing`
    - Create `types/recommendation.ts` with `RecommendationType` and `Recommendation`
    - Create `types/audit.ts` with `AuditInput`, `AuditResult`, `AuditError`, `AuditEngineOutput`, `StoredAudit`
    - Create `types/api.ts` with all request/response body interfaces
    - All types must use named interfaces/type aliases — no inline object literals
    - _Requirements: 13.2, 13.6_

- [x] 2. Pricing data module
  - [x] 2.1 Implement `lib/constants/pricingData.ts`
    - Export `PRICING_DATA_VERSION = "1.0.0"` as a semver string constant
    - Export `PRICING_DATA: ToolPricing[]` with all 6 tools and their plans at the exact prices specified
    - File must contain only constant declarations and type annotations — no function calls or side effects
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

  - [x] 2.2 Write unit tests for `pricingData` in `tests/pricing/pricingData.test.ts`
    - Verify `PRICING_DATA_VERSION` matches semver format
    - Verify all 6 tools are present with their correct plan counts and prices
    - Verify no plan entry has a negative price
    - _Requirements: 10.4, 12.1_

- [x] 3. Audit engine — calculations and rules
  - [x] 3.1 Implement `lib/utils/currency.ts` and `lib/utils/uuid.ts`
    - `currency.ts`: export `formatUSD(amount: number): string` and `roundToTwoDP(n: number): number` using half-up rounding
    - `uuid.ts`: export `generateUUID(): string` using the `uuid` package's `v4()` function
    - _Requirements: 3.6, 8.6, 13.4_

  - [x] 3.2 Implement `lib/audit/calculations.ts`
    - Export `computeMonthlySavings(currentPricePerSeat, recommendedPricePerSeat, seats)` — rounds result to 2dp
    - Export `computeYearlySavings(monthlySavings)` — multiplies by 12, rounds to 2dp
    - Export `computeScore(totalCurrentSpend, totalMonthlySavings): number` — implements the clamped formula; returns 100 when spend is 0
    - Export `aggregateSavings(recommendations)` — sums monthly and yearly savings across all recommendations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 4.1, 4.2, 4.3_

  - [x] 3.3 Write property test for calculations — Property 9 (`tests/audit/calculations.test.ts`)
    - **Property 9: Savings Aggregation Invariant**
    - **Validates: Requirements 3.3, 3.4**
    - Use `fast-check` with `numRuns: 100`; annotate with `// Feature: aistack-auditor, Property 9`

  - [x] 3.4 Write property test for calculations — Property 10 (`tests/audit/calculations.test.ts`)
    - **Property 10: Monetary Value Invariants** — yearlySavings = monthlySavings × 12, both rounded to 2dp, monthlySavings > 0
    - **Validates: Requirements 3.2, 3.6, 3.7**
    - Use `fast-check` with `numRuns: 100`; annotate with `// Feature: aistack-auditor, Property 10`

  - [x] 3.5 Write property test for calculations — Property 11 (`tests/audit/calculations.test.ts`)
    - **Property 11: Optimization Score Formula and Range**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Include the required example tests: `computeScore(100, 25) === 75` and `computeScore(0, 0) === 100`
    - Use `fast-check` with `numRuns: 100`; annotate with `// Feature: aistack-auditor, Property 11`

  - [x] 3.6 Implement `lib/audit/rules.ts`
    - Implement `ruleTeamDowngrade`: ChatGPT Team ≤ 2 seats → downgrade to Plus (Req 2.2)
    - Implement `ruleEnterpriseDowngrade`: Enterprise plan < 5 seats → downgrade to next lower tier (Req 2.3)
    - Implement `ruleFreeTier`: paid plan with 1 seat where Free tier exists → switch to Free (Req 2.7)
    - Implement `ruleLLMOverlap`: ChatGPT + Claude + Gemini simultaneously → single overlap recommendation (Req 2.4)
    - Implement `ruleCursorCopilotOverlap`: Cursor + GitHub Copilot → overlap, retain higher seat count (Req 2.5)
    - Implement `ruleCursorWindsurfOverlap`: Cursor + Windsurf → overlap, retain higher seat count (Req 2.6)
    - All rules must source prices exclusively from `PRICING_DATA`; omit recommendations with savings ≤ 0 (Req 3.7)
    - Each rule must return a deterministic `id` string in the format `${ruleId}-${toolName}`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.7, 10.3, 10.6_

  - [x] 3.7 Write property tests for rules — Properties 2, 3, 4, 5, 6 (`tests/audit/rules.test.ts`)
    - **Property 2: ChatGPT Team Downgrade Savings Formula** — Validates: Requirements 2.2, 3.1, 3.2
    - **Property 3: Enterprise Downgrade Rule** — Validates: Requirements 2.3, 3.1
    - **Property 4: LLM Overlap Detection** — Validates: Requirements 2.4
    - **Property 5: IDE Tool Overlap Retention Rule** — Validates: Requirements 2.5, 2.6
    - **Property 6: Free-Tier Recommendation** — Validates: Requirements 2.7
    - Use `fast-check` with `numRuns: 100`; annotate each with `// Feature: aistack-auditor, Property N`

  - [x] 3.8 Implement `lib/audit/engine.ts`
    - Export `runAudit(input: AuditInput): AuditEngineOutput` as a pure function
    - Validate input: return `AuditError { code: "INVALID_INPUT" }` for missing/invalid fields (Req 2.11)
    - Validate input: return `AuditError { code: "TOO_MANY_ENTRIES" }` for > 10 entries (Req 2.12)
    - Run all rules from `rules.ts` and collect recommendations
    - Return `AuditError { code: "MISSING_PRICING" }` if any rule references a missing Tool/Plan (Req 10.6)
    - Compute totals via `aggregateSavings` and score via `computeScore`
    - Attach `engineVersion` from `PRICING_DATA_VERSION`
    - No imports from `next`, `react`, `react-dom`, `@radix-ui`, or `components/`
    - Must complete synchronously in under 50ms for ≤ 10 entries
    - _Requirements: 2.1, 2.8, 2.9, 2.10, 2.11, 2.12, 13.3_

  - [x] 3.9 Write property tests for engine — Properties 1, 7, 8 (`tests/audit/engine.test.ts`)
    - **Property 1: Audit Engine Determinism** — Validates: Requirements 2.8
    - **Property 7: Invalid Input Returns Error** — Validates: Requirements 2.11
    - **Property 8: Oversized Input Returns Error** — Validates: Requirements 2.12
    - Include required example tests from Req 12.2–12.6 (ChatGPT Team 2 seats, overlap naming, score formula, no-match empty array, monetary rounding)
    - Use `fast-check` with `numRuns: 100`; annotate each with `// Feature: aistack-auditor, Property N`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Zod schemas and shared arbitraries
  - [x] 5.1 Implement Zod schemas in `lib/schemas/`
    - Create `lib/schemas/auditSchema.ts` with `toolEntrySchema` and `auditRequestSchema` exactly as specified in the design
    - Create `lib/schemas/leadSchema.ts` with `leadSchema` (email, company, role, teamSize, auditId)
    - Create `lib/schemas/summarySchema.ts` with `summaryRequestSchema` (auditId, recommendations, savings totals)
    - No field-level validation logic outside these Zod schemas
    - _Requirements: 7.8, 11.5, 13.7_

  - [x] 5.2 Create shared `fast-check` arbitraries in `tests/arbitraries.ts`
    - Export `toolNameArb`, `planNameArb`, `toolEntryArb`, `validToolArrayArb` as specified in the design
    - _Requirements: 12.1_

  - [x] 5.3 Write property tests for lead schema — Property 12 (`tests/schemas/leadSchema.test.ts`)
    - **Property 12: Lead Zod Schema Rejects Invalid Inputs**
    - **Validates: Requirements 7.8**
    - Use `fast-check` with `numRuns: 100`; annotate with `// Feature: aistack-auditor, Property 12`

- [x] 6. Supabase and infrastructure clients
  - [x] 6.1 Implement Supabase clients and Resend client
    - Create `lib/supabase/client.ts` — browser-side Supabase client using env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - Create `lib/supabase/server.ts` — server-side Supabase client using `SUPABASE_SERVICE_ROLE_KEY`
    - Create `lib/resend/client.ts` — Resend client wrapper using `RESEND_API_KEY`
    - Create `lib/resend/templates.ts` — export `buildConfirmationEmail(email: string, reportUrl: string): { subject: string; html: string }` with the shareable URL in the body
    - _Requirements: 7.4, 8.1_

- [x] 7. AI summary module
  - [x] 7.1 Implement `lib/ai/prompts.ts` and `lib/ai/client.ts`
    - `prompts.ts`: export `buildAuditPrompt(result: AuditResult): string` targeting an 80–120 word summary; export `buildFallbackSummary(result: AuditResult): string` as specified in the design
    - `client.ts`: export `generateSummary(prompt: string): Promise<string>` wrapping the Anthropic SDK with a 10-second timeout; throws on non-2xx or timeout
    - No prompt strings embedded in API route handlers
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

- [x] 8. API routes
  - [x] 8.1 Implement `app/api/audit/route.ts` — `POST /api/audit`
    - Validate request body with `auditRequestSchema`; return 400 with `errors` array on failure
    - Call `runAudit`; return 400/500 for engine errors
    - Persist audit record to Supabase `audits` table with UUID v4 id; return 503 if Supabase write fails
    - Return `{ auditId, recommendations, totalMonthlySavings, totalYearlySavings, optimizationScore }`
    - Full response (excluding AI summary) must complete within 3 seconds
    - Log all 5xx errors server-side
    - _Requirements: 11.1, 11.5, 11.6, 11.7_

  - [x] 8.2 Implement `app/api/generate-summary/route.ts` — `POST /api/generate-summary`
    - Validate request body with `summaryRequestSchema`; return 400 on failure
    - Call `generateSummary` with the prompt from `buildAuditPrompt`; fall back to `buildFallbackSummary` on Claude failure or timeout
    - Return 500 with `{ message: "Summary generation failed" }` if both Claude and fallback fail
    - Log all 5xx errors server-side
    - _Requirements: 6.1, 6.3, 6.4, 11.2, 11.5, 11.6_

  - [x] 8.3 Implement `app/api/leads/route.ts` — `POST /api/leads`
    - Validate request body with `leadSchema`; return 400 with `errors` array on failure
    - Write lead record to Supabase `leads` table; return error response if write fails (do not send email)
    - Trigger Resend confirmation email; log Resend errors silently without surfacing to user
    - Return `{ success: true, reportUrl }` on success
    - Log all 5xx errors server-side
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 7.8, 11.3, 11.5, 11.6_

  - [x] 8.4 Implement `app/api/share/[id]/route.ts` — `GET /api/share/[id]`
    - Retrieve audit record from Supabase by UUID; return 404 if not found
    - Return `{ audit: StoredAudit }` on success
    - Log all 5xx errors server-side
    - _Requirements: 11.4, 11.5, 11.6_

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Hooks and form state
  - [x] 10.1 Implement `hooks/useLocalStorage.ts`
    - Generic hook: `useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]`
    - Wraps reads in try/catch; returns `initialValue` on parse failure
    - _Requirements: 1.7, 1.8_

  - [x] 10.2 Implement `hooks/useAuditForm.ts`
    - Use React Hook Form with `zodResolver(auditRequestSchema)`
    - Persist form state to localStorage on every change using `useLocalStorage`
    - On mount, restore from localStorage; validate against `auditRequestSchema`; discard and initialize with one empty row if invalid or corrupt
    - Expose `fields`, `append`, `remove`, `handleSubmit`, `formState`
    - _Requirements: 1.7, 1.8, 13.7_

- [x] 11. UI primitive components
  - [x] 11.1 Implement shared UI primitives in `components/ui/`
    - Create `Button.tsx`, `Input.tsx`, `Select.tsx`, `Badge.tsx`, `Card.tsx`, `Spinner.tsx`
    - Each component must have a named TypeScript interface for its props
    - All interactive elements must be keyboard-navigable and accessible (proper ARIA attributes, focus styles)
    - _Requirements: 1.9, 9.7, 13.6_

- [x] 12. Audit form components
  - [x] 12.1 Implement `components/audit/ToolRow.tsx`
    - Render fields: Tool name (select), Plan (select, populated from `PRICING_DATA` for selected tool), seats (number input), monthly spend (number input), use case (textarea, max 500 chars)
    - Show inline validation errors for each field
    - Disable (not hide) the remove button when `isRemoveDisabled` is true
    - When Tool changes, reset Plan and show error if tool has no plans in `PRICING_DATA`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 12.2 Implement `components/audit/AuditForm.tsx` and `components/audit/ToolRowSkeleton.tsx`
    - Use `useAuditForm` hook for all state and validation
    - Render dynamic list of `ToolRow` components; allow adding up to 10 rows
    - Disable remove button on the last remaining row
    - Show inline validation errors on submit; prevent submission if any required field is invalid
    - On successful submit: call `POST /api/audit`, then `POST /api/generate-summary`, then navigate to `/report/[auditId]`
    - Render `ToolRowSkeleton` while loading
    - Responsive layout: no horizontal scrollbars from 320px to 2560px
    - _Requirements: 1.1, 1.2, 1.4, 1.9_

- [x] 13. Report page components
  - [x] 13.1 Implement `components/report/ScoreBadge.tsx` and `components/report/ReportHeader.tsx`
    - `ScoreBadge`: render score with color-coded label — green (80–100), yellow (50–79), red (0–49)
    - `ReportHeader`: display optimization score (via `ScoreBadge`), total monthly savings, and total yearly savings formatted as USD
    - _Requirements: 4.4, 5.1_

  - [x] 13.2 Implement `components/report/RecommendationCard.tsx`
    - Display: tool name, current plan, recommended plan/action, monthly savings (USD), yearly savings (USD), explanation
    - For plan-downgrade recommendations: show current price/seat and recommended price/seat side by side
    - Show "Overlap" badge only on overlap-type recommendations
    - _Requirements: 5.1, 5.4, 5.5_

  - [x] 13.3 Implement `components/report/AiInsightsCard.tsx`
    - Render AI summary in a card with distinct background color and visible border, labeled "AI Insights"
    - Show loading spinner while `isLoading` is true
    - If `error` is non-null, hide the card and show an inline error message in its place
    - _Requirements: 6.5_

  - [x] 13.4 Implement `components/report/LeadCaptureForm.tsx` and `components/report/LeadConfirmation.tsx`
    - `LeadCaptureForm`: React Hook Form + Zod for email (required, RFC 5322), company (required), role (required), team size (required, 1–10,000)
    - On valid submit: call `POST /api/leads`; show inline errors on invalid fields
    - On success: call `onSuccess(reportUrl)` to trigger parent state change
    - On Supabase failure: show error message; do not show email failure to user
    - `LeadConfirmation`: display shareable report URL as a visible, copyable link
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8_

- [x] 14. Report page and audit form page
  - [x] 14.1 Implement `app/report/[id]/page.tsx`
    - Fetch audit data from Supabase server-side; call `notFound()` for missing ID, query failure, or parse failure
    - Render `ReportHeader`, sorted `RecommendationCard` list (descending monthly savings, then tool name A–Z), `AiInsightsCard`, and `LeadCaptureForm`/`LeadConfirmation`
    - If no recommendations, display "stack is already well-optimized" message
    - Include Open Graph meta tags: `og:title`, `og:description`, `og:url` as specified
    - _Requirements: 5.2, 5.3, 8.2, 8.3, 8.4, 8.5_

  - [x] 14.2 Implement `app/audit/page.tsx`
    - Render `AuditForm` component
    - _Requirements: 1.1_

- [x] 15. Landing page
  - [x] 15.1 Implement landing page components in `components/landing/`
    - Create `Hero.tsx`: headline, sub-headline, primary CTA button that navigates to `/audit`
    - Create `Features.tsx`: at least 4 features, each with an icon and ≤ 100-char description
    - Create `HowItWorks.tsx`: 3 or fewer numbered steps describing the audit process
    - Create `Faq.tsx`: at least 4 questions with expand/collapse toggle behavior
    - Create `Cta.tsx`: secondary call-to-action section
    - Create `Footer.tsx`
    - All components must have named TypeScript interfaces for props; all interactive elements keyboard-navigable
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 13.6_

  - [x] 15.2 Implement `app/page.tsx` — landing page
    - Compose landing page sections in order: Hero, Features, HowItWorks, Faq, Cta, Footer
    - Responsive layout: no horizontal scrollbars from 320px to 2560px
    - _Requirements: 9.1, 9.7_

- [x] 16. UUID utility tests
  - [x] 16.1 Write property test for UUID generation — Property 13 (`tests/utils/uuid.test.ts`)
    - **Property 13: UUID Uniqueness** — two separate calls produce different strings, each matching UUID v4 regex
    - **Validates: Requirements 8.1, 8.6**
    - Use `fast-check` with `numRuns: 100`; annotate with `// Feature: aistack-auditor, Property 13`

- [x] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints at tasks 4, 9, and 17 ensure incremental validation
- Property tests use `fast-check` with `numRuns: 100` and are annotated with `// Feature: aistack-auditor, Property N`
- Unit tests cover the specific required scenarios from Requirement 12
- The audit engine (`lib/audit/engine.ts`) must never import from `next`, `react`, `react-dom`, `@radix-ui`, or `components/`
- All monetary values use `roundToTwoDP` from `lib/utils/currency.ts` — no inline rounding elsewhere
- Environment variables required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "5.2"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "5.1"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "3.6"] },
    { "id": 5, "tasks": ["3.7", "3.8", "5.3"] },
    { "id": 6, "tasks": ["3.9", "6.1", "7.1"] },
    { "id": 7, "tasks": ["8.1", "8.2", "8.3", "8.4", "10.1"] },
    { "id": 8, "tasks": ["10.2", "11.1"] },
    { "id": 9, "tasks": ["12.1"] },
    { "id": 10, "tasks": ["12.2"] },
    { "id": 11, "tasks": ["13.1", "13.2", "13.3", "13.4"] },
    { "id": 12, "tasks": ["14.1", "14.2", "16.1"] },
    { "id": 13, "tasks": ["15.1"] },
    { "id": 14, "tasks": ["15.2"] }
  ]
}
```
