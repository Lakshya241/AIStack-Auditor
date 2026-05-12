import React from "react";
import Link from "next/link";

export interface CtaProps {
  headline?: string;
  subHeadline?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function Cta({
  headline = "Ready to cut your AI costs?",
  subHeadline = "Join thousands of teams who have already optimised their AI stack. It takes less than 2 minutes.",
  primaryLabel = "Start Your Free Audit",
  primaryHref = "/audit",
  secondaryLabel = "See a sample report",
  secondaryHref = "#",
}: CtaProps): React.ReactElement {
  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-blue-600 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="cta-heading"
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {headline}
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
          {subHeadline}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-lg transition-all duration-150 hover:bg-blue-50 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
          >
            {primaryLabel}
            <svg
              aria-hidden="true"
              className="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>

          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-8 py-4 text-base font-semibold text-white transition-all duration-150 hover:border-white/70 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>

        <p className="mt-6 text-sm text-blue-200">
          Free forever &middot; No credit card required &middot; No account needed
        </p>
      </div>
    </section>
  );
}
