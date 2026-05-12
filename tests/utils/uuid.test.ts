import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateUUID } from "../../lib/utils/uuid";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Feature: aistack-auditor, Property 13
// **Validates: Requirements 8.1, 8.6**
describe("Property 13: UUID Uniqueness", () => {
  it("two separate calls produce different strings, each matching UUID v4 regex", () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        (_) => {
          const id1 = generateUUID();
          const id2 = generateUUID();

          // Both must match UUID v4 format
          expect(id1).toMatch(UUID_V4_REGEX);
          expect(id2).toMatch(UUID_V4_REGEX);

          // The two IDs must be different
          expect(id1).not.toBe(id2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
