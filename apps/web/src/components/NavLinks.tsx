"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Only pages that exist. Add an item together with its page. */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Catalogue", href: "/listings" },
  { label: "Sell", href: "/sell" },
  { label: "Agents", href: "/agents" },
];

/** A section stays lit on its sub-pages (`/listings/abc`), but `/sell` doesn't light `/sel`. */
export function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.slice(0, href.length + 1) === `${href}/`;
}

type Pill = { x: number; w: number } | null;

// useLayoutEffect warns during server rendering; this nav only measures in the browser.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Desktop links with a highlight that glides to the current page. It is positioned from the real
 * link boxes, re-measured when they resize (a web font arriving late changes their width), and it
 * jumps into place the first time so it doesn't slide in from the left edge.
 */
export default function NavLinks() {
  const pathname = usePathname();
  const row = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<Pill>(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const container = row.current;
    const active = container?.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    if (!container || !active) return setPill(null);
    setPill({ x: active.offsetLeft, w: active.offsetWidth });
  }, []);

  useIsoLayoutEffect(() => {
    measure();
  }, [pathname, measure]);

  useEffect(() => {
    // Allow the glide only after the first placement has been painted.
    const id = requestAnimationFrame(() => setAnimate(true));
    const ro = new ResizeObserver(measure);
    if (row.current) ro.observe(row.current);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [measure]);

  return (
    <div ref={row} className="relative hidden items-center gap-1 md:flex">
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 rounded-full bg-black/[0.06] ${
          animate
            ? "transition-[transform,width,opacity] duration-400 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
            : ""
        }`}
        style={{
          width: pill?.w ?? 0,
          transform: `translateX(${pill?.x ?? 0}px)`,
          opacity: pill ? 1 : 0,
        }}
      />
      {NAV_LINKS.map(({ label, href }) => {
        const current = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              current ? "font-medium text-black" : "text-gray-600 hover:text-black"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
