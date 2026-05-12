import React from "react";
import Link from "next/link";

export interface HeroProps {
  headline?: string;
  subHeadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function Hero({
  headline = "Audit Your AI Stack in Minutes",
  subHeadline = "Discover hidden costs, redundant tools, and smarter alternatives across your entire AI toolset — for free.",
  ctaLabel = "Start Your Free Audit",
  ctaHref = "/audit",
}: HeroProps): React.ReactElement {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-20 sm:px-6 lg:px-8 lg:py-32"
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <h1
          id="hero-heading"
          className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          {headline}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl">
          {subHeadline}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-lg transition-all duration-150 hover:bg-blue-50 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
          >
            {ctaLabel}
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

          <p className="text-sm text-blue-200">
            No sign-up required &middot; Results in under 2 minutes
          </p>
        </div>
      </div>
    </section>
  );
}
