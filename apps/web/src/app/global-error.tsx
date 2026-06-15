"use client";

import "./globals.css";
import { Icon } from "@/components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-luxury bg-fixed flex flex-col items-center justify-center px-4 text-center font-sans">
        <div className="court-columns" aria-hidden="true" />
        <div className="court-motif" aria-hidden="true" />
        <div className="app-layer card card-body-spacious max-w-md w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-danger mb-5 ring-1 ring-red-100 shadow-luxury">
            <Icon name="error" size="xl" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-3">Application error</h1>
          <p className="text-gray-800 text-base mb-8 leading-relaxed font-medium">
            {error.message || "A critical error occurred. Try reloading the page."}
          </p>
          <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={reset}>
            <Icon name="refresh" size="sm" className="text-white" />
            Reload App
          </button>
        </div>
      </body>
    </html>
  );
}
