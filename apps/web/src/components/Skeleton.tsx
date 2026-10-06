import type { ReactNode } from "react";

/**
 * A placeholder the size of the thing that is coming. Always aria-hidden: the
 * loading announcement belongs on the region that owns the load (SkeletonRegion).
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

/** A loading region: skeletons plus the one announcement that covers them. */
export function SkeletonRegion({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}
