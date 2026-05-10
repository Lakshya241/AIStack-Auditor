import { v4 as uuidv4 } from "uuid";

/**
 * Generates a UUID v4 string.
 */
export function generateUUID(): string {
  return uuidv4();
}
