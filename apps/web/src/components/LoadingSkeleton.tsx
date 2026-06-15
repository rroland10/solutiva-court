export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 skeleton-bar rounded-lg"
          style={{ width: `${100 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card card-body animate-pulse" aria-label="Loading">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl skeleton-bar shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 skeleton-bar rounded-lg w-3/4" />
          <div className="h-4 skeleton-bar-muted rounded-lg w-1/2" />
        </div>
        <div className="h-7 w-20 skeleton-bar rounded-full" />
      </div>
      <div className="space-y-2 ml-[52px]">
        <div className="h-4 skeleton-bar-muted rounded-lg" />
        <div className="h-4 skeleton-bar-muted rounded-lg w-5/6" />
      </div>
    </div>
  );
}

export function StatsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 text-center animate-pulse"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="w-10 h-10 rounded-xl skeleton-bar mx-auto mb-2" />
          <div className="h-8 skeleton-bar rounded-lg w-16 mx-auto mb-1" />
          <div className="h-4 skeleton-bar-muted rounded-lg w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}
