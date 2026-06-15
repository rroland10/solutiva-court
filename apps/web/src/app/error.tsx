"use client";

import { Icon } from "@/components/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-luxury dark:bg-gradient-luxury-dark bg-fixed flex flex-col items-center justify-center px-4 text-center">
      <div className="app-layer card card-body-spacious max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-danger mb-5 ring-1 ring-red-100 shadow-luxury">
          <Icon name="error" size="xl" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-gray-900 mb-3">Something went wrong</h1>
        <p className="text-gray-800 text-base mb-8 leading-relaxed font-medium">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={reset}>
          <Icon name="refresh" size="sm" className="text-white" />
          Try Again
        </button>
      </div>
    </div>
  );
}
