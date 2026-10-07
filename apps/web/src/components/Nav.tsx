"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu, TestnetBadge } from "@/components/AccountMenu";
import NavLinks, { isActive, NAV_LINKS } from "@/components/NavLinks";

/** True once the page has scrolled past `offset` px. */
function useScrolledPast(offset = 8) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const check = () => setPast(window.scrollY > offset);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [offset]);
  return past;
}

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  // The bar only gets its shadow once content sits under it; at the top it stays flat.
  const lifted = useScrolledPast();

  // Close the mobile panel whenever the route changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <nav
      className={`sticky top-0 z-30 border-b border-gray-100/80 backdrop-blur-md transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none ${
        lifted ? "bg-white/90 shadow-[0_1px_24px_rgba(0,0,0,0.07)]" : "bg-white/70"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
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
            className="rounded-lg p-1 md:hidden"
            aria-controls="mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X aria-hidden className="h-6 w-6" />
            ) : (
              <Menu aria-hidden className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="border-t border-gray-200 bg-white px-4 pt-3 pb-5 sm:px-6 md:hidden"
      >
        <ul className="space-y-1">
          {NAV_LINKS.map((item) => {
            const here = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={here ? "page" : undefined}
                  className={`block rounded-xl px-3 py-2.5 text-sm ${
                    here
                      ? "bg-gray-100 font-medium text-black"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 border-t border-gray-100 px-3 pt-4">
          <AccountMenu />
        </div>
      </div>
    </nav>
  );
}
