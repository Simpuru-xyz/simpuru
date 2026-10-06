import Link from "next/link";
import { Fragment } from "react";

/** Where you are, and the way back. Stands in for a "back" button on detail pages. */
export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="truncate text-sm text-gray-500">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <span className="mx-1.5 text-gray-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-black">
              {item.label}
            </Link>
          ) : (
            <span
              aria-current={i === items.length - 1 ? "page" : undefined}
              className="text-gray-700"
            >
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
