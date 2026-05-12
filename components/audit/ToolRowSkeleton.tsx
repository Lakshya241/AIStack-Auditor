"use client";

import React from "react";

/**
 * Loading skeleton that mirrors the ToolRow card layout.
 * Shown while the form is initialising or while a submission is in progress.
 */
export function ToolRowSkeleton(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-pulse"
    >
      {/* Row number badge placeholder */}
      <span className="absolute -top-3 left-4 h-5 w-6 rounded-full bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tool select skeleton */}
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-10 rounded bg-gray-200" />
          <div className="h-9 w-full rounded-md bg-gray-200" />
        </div>

        {/* Plan select skeleton */}
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-10 rounded bg-gray-200" />
          <div className="h-9 w-full rounded-md bg-gray-200" />
        </div>

        {/* Seats input skeleton */}
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-10 rounded bg-gray-200" />
          <div className="h-9 w-full rounded-md bg-gray-200" />
        </div>

        {/* Monthly spend input skeleton */}
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-9 w-full rounded-md bg-gray-200" />
        </div>

        {/* Use case textarea skeleton — spans 2 cols on sm+, 2 cols on lg+ */}
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-16 w-full rounded-md bg-gray-200" />
        </div>
      </div>

      {/* Remove button skeleton */}
      <div className="mt-4 flex justify-end">
        <div className="h-7 w-16 rounded-md bg-gray-200" />
      </div>
    </div>
  );
}
