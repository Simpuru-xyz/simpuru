import type { ReactNode } from "react";

type BoxProps = { className?: string };

/** Grey stand-in shaped like the content on its way. Decorative, so hidden from screen readers. */
export default function Skeleton({ className = "" }: BoxProps) {
  return <span aria-hidden className={`block animate-pulse rounded-md bg-gray-100 ${className}`} />;
}

/**
 * Wraps a group of skeletons and announces the load once ("Loading…"), instead of once per box.
 */
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
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        {label}
      </span>
      {children}
    </div>
  );
}
