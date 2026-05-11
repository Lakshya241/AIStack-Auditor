import { Resend } from "resend";

/**
 * Resend client instance.
 * Only import this module from server-side code (API routes, Server Components).
 */
export const resendClient = new Resend(process.env.RESEND_API_KEY!);
