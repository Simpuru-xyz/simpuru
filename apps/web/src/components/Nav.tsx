"use client";

import gsap from "gsap";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccountMenu, TestnetBadge } from "@/components/AccountMenu";
import NavLinks, { isActive, NAV_LINKS } from "@/components/NavLinks";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);

  // Shadow only once something scrolls underneath; a permanent one floats over nothing.
  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lifted: boolean | undefined;

    const onScroll = () => {
      const next = window.scrollY > 8;
      if (next === lifted) return;
      lifted = next;
      gsap.to(element, {
        boxShadow: next ? "0 1px 24px rgba(0,0,0,0.07)" : "0 1px 0 rgba(0,0,0,0)",
        backgroundColor: next ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.7)",
        duration: reduced ? 0 : 0.3,
        ease: "power2.out",
        overwrite: true,
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav ref={bar} className="sticky top-0 z-30 border-b border-gray-100/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/listings" className="text-lg font-semibold tracking-tight text-black">
          Simpuru
        </Link>

        <NavLinks />

        <div className="flex items-center gap-3">
          <TestnetBadge />
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-2 px-4 py-4 sm:px-6 lg:px-10">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={`rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  isActive(pathname, href)
                    ? "bg-black/[0.06] font-medium text-black"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 px-3 pt-4">
              <AccountMenu />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
