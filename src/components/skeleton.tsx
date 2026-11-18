export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl bg-surface">
          <div className="aspect-[4/3] animate-pulse bg-line/60" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-line" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlockSkeleton({ className = "h-40" }: { className?: string }) {
  return <div className={`mx-4 animate-pulse rounded-3xl bg-line/60 ${className}`} />;
}
