"use client";

import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Only pages that exist. Add an item together with its page. */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Catalogue", href: "/listings" },
];

/** `/listings` stays lit on `/listings/<id>`, but a bare prefix does not match. */
export const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Desktop nav with one pill that slides to the current page. Measured from the
 * DOM, so a late font cannot leave it sized for the fallback; the first
 * placement jumps instead of flying in from x=0.
 */
export default function NavLinks() {
  const pathname = usePathname();
  const pill = useRef<HTMLSpanElement>(null);
  const items = useRef<Record<string, HTMLAnchorElement | null>>({});
  const placed = useRef(false);

  useEffect(() => {
    const active = NAV_LINKS.find((link) => isActive(pathname, link.href));
    const element = active ? items.current[active.href] : undefined;
    const target = pill.current;
    if (!target) return;

    if (!element) {
      gsap.to(target, { autoAlpha: 0, duration: 0.2, overwrite: true });
      placed.current = false;
      return;
    }

    const duration = placed.current && !reducedMotion() ? 0.42 : 0;
    placed.current = true;
    gsap.to(target, {
      x: element.offsetLeft,
      width: element.offsetWidth,
      autoAlpha: 1,
      duration,
      ease: "power3.out",
      overwrite: true,
    });
  }, [pathname]);

  return (
    <div className="relative hidden items-center gap-1 md:flex">
      <span
        aria-hidden
        ref={pill}
        className="absolute top-0 bottom-0 left-0 rounded-full bg-black/[0.06]"
        style={{ opacity: 0, width: 0 }}
      />
      {NAV_LINKS.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          ref={(node) => {
            items.current[href] = node;
          }}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${
            isActive(pathname, href) ? "font-medium text-black" : "text-gray-600 hover:text-black"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
