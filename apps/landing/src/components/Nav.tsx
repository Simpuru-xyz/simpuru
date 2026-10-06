import Image from "next/image";
import Link from "next/link";
import { MCP_DOCS_URL } from "@/lib/links";

/**
 * The landing header carries the logo and one link out, nothing more.
 *
 * Catalogue, purchases and the seller dashboard are reached from the hero and
 * the footer. The MCP setup is the exception: it is useful to a visitor who has
 * never bought anything, which is exactly who reads it.
 *
 * With no menu there is no state, so this stays a server component.
 */
export default function Nav() {
  return (
    <nav
      className="animate-fade-in-up relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"
      style={{ animationDelay: "0.1s", opacity: 0 }}
    >
      {/* Dark mark on a light surface. On a dark surface use the white
          variant, never black on black. */}
      <Link href="/" className="flex items-center">
        <Image
          src="/logo.svg"
          alt="Simpuru"
          width={64}
          height={64}
          className="h-12 w-12 sm:h-14 sm:w-14"
          priority
        />
      </Link>

      <a
        href={MCP_DOCS_URL}
        className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700 transition-colors hover:border-black hover:text-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        MCP setup
      </a>
    </nav>
  );
}
