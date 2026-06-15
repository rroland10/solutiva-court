"use client";

import { LoadingSkeleton } from "./LoadingSkeleton";

export function AppLoading() {
  return (
    <div className="app-layer min-h-screen flex flex-col">
      <div className="h-[4.25rem] glass border-b border-white/25" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-10 space-y-4">
          <div className="h-12 w-72 bg-white/25 rounded-2xl animate-pulse" />
          <div className="h-6 w-96 max-w-full bg-white/15 rounded-xl animate-pulse" />
          <div className="luxury-divider max-w-[12rem] opacity-60" />
        </div>
        <div className="page-body">
          <div className="card-featured card-body">
            <LoadingSkeleton lines={5} />
          </div>
        </div>
      </main>
    </div>
  );
}
