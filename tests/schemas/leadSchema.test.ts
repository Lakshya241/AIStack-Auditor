import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { leadSchema } from "../../lib/schemas/leadSchema";

// Feature: aistack-auditor, Property 12
// **Validates: Requirements 7.8**

// Arbitraries for valid lead fields
// Zod's email validator uses a stricter subset of RFC 5322 (no special chars like ! in local part).
// We generate emails of the form: [a-z0-9]+@[a-z0-9]+.[a-z]{2,6}
const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{1,20}$/),
    fc.stringMatching(/^[a-z0-9]{1,20}$/),
    fc.stringMatching(/^[a-z]{2,6}$/)
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
const validCompanyArb = fc.string({ minLength: 1, maxLength: 200 });
const validRoleArb = fc.string({ minLength: 1, maxLength: 200 });
const validTeamSizeArb = fc.integer({ min: 1, max: 10000 });
const validAuditIdArb = fc.uuid();

// Arbitraries for invalid lead fields
const invalidEmailArb = fc.oneof(
  fc.constant(""),
  fc.constant("not-an-email"),
  fc.constant("missing@"),
  fc.constant("@nodomain"),
  fc.constant("spaces in@email.com"),
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("@"))
);

const invalidCompanyArb = fc.constant(""); // empty string violates min(1)

const invalidRoleArb = fc.constant(""); // empty string violates min(1)

const invalidTeamSizeArb = fc.oneof(
  fc.integer({ min: -1000, max: 0 }),       // below minimum (1)
  fc.integer({ min: 10001, max: 20000 }),   // above maximum (10000)
  fc.float({ min: Math.fround(1.1), max: Math.fround(9999.9), noNaN: true }).filter((n) => !Number.isInteger(n)) // non-integer
);

const invalidAuditIdArb = fc.oneof(
  fc.constant(""),
  fc.constant("not-a-uuid"),
  fc.constant("12345678-1234-1234-1234-12345678901"), // too short
  fc.constant("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"), // invalid hex chars
  fc.string({ minLength: 1, maxLength: 30 }).filter(
    (s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  )
);

describe("Property 12: Lead Zod Schema Rejects Invalid Inputs", () => {
  it("accepts any lead object where all fields are valid", () => {
    fc.assert(
      fc.property(
        validEmailArb,
        validCompanyArb,
        validRoleArb,
        validTeamSizeArb,
        validAuditIdArb,
        (email, company, role, teamSize, auditId) => {
          const result = leadSchema.safeParse({ email, company, role, teamSize, auditId });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any lead object with a malformed email", () => {
    fc.assert(
      fc.property(
        invalidEmailArb,
        validCompanyArb,
        validRoleArb,
        validTeamSizeArb,
        validAuditIdArb,
        (email, company, role, teamSize, auditId) => {
          const result = leadSchema.safeParse({ email, company, role, teamSize, auditId });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any lead object with an empty company name", () => {
    fc.assert(
      fc.property(
        validEmailArb,
        invalidCompanyArb,
        validRoleArb,
        validTeamSizeArb,
        validAuditIdArb,
        (email, company, role, teamSize, auditId) => {
          const result = leadSchema.safeParse({ email, company, role, teamSize, auditId });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any lead object with an empty role", () => {
    fc.assert(
      fc.property(
        validEmailArb,
        validCompanyArb,
        invalidRoleArb,
        validTeamSizeArb,
        validAuditIdArb,
        (email, company, role, teamSize, auditId) => {
          const result = leadSchema.safeParse({ email, company, role, teamSize, auditId });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any lead object with a team size outside [1, 10000]", () => {
    fc.assert(
      fc.property(
        validEmailArb,
        validCompanyArb,
        validRoleArb,
        invalidTeamSizeArb,
        validAuditIdArb,
        (email, company, role, teamSize, auditId) => {
          const result = leadSchema.safeParse({ email, company, role, teamSize, auditId });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any lead object with a non-UUID auditId", () => {
    fc.assert(
      fc.property(
        validEmailArb,
        validCompanyArb,
        validRoleArb,
        validTeamSizeArb,
        invalidAuditIdArb,
        (email, company, role, teamSize, auditId) => {
          const result = leadSchema.safeParse({ email, company, role, teamSize, auditId });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
