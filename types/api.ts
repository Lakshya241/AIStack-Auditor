import type { StoredAudit } from "./audit";
import type { Recommendation } from "./recommendation";
import type { ToolEntry } from "./tool";

// POST /api/audit
export interface AuditRequestBody {
  tools: ToolEntry[];
}
export interface AuditResponseBody {
  auditId: string;
  recommendations: Recommendation[];
  totalMonthlySavings: number;
  totalYearlySavings: number;
  optimizationScore: number;
}

// POST /api/generate-summary
export interface SummaryRequestBody {
  auditId: string;
  recommendations: Recommendation[];
  totalMonthlySavings: number;
  totalYearlySavings: number;
}
export interface SummaryResponseBody {
  summary: string;
}

// POST /api/leads
export interface LeadRequestBody {
  email: string;
  company: string;
  role: string;
  teamSize: number;
  auditId: string;
}
export interface LeadResponseBody {
  success: boolean;
  reportUrl: string;
}

// GET /api/share/[id]
export interface ShareResponseBody {
  audit: StoredAudit;
}

// Generic error response
export interface ApiErrorResponse {
  message: string;
  errors?: Array<{ field: string; message: string }>;
}
