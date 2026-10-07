import Image from "next/image";
import Link from "next/link";

/**
 * The landing header carries the logo only. The hero's "Launch app" is the way
 * in; the network is named in the hero copy.
 */
export default function Nav() {
  return (
    <nav
      className="animate-fade-in-up relative z-30 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6"
      style={{ animationDelay: "0.1s", opacity: 0 }}
    >
      {/* Dark mark on a light surface. On a dark surface use the white
          variant, never black on black. */}
      <Link href="/" className="flex shrink-0 items-center">
        <Image
          src="/logo.svg"
          alt="Simpuru"
          width={64}
          height={64}
          className="h-12 w-12 sm:h-14 sm:w-14"
          priority
        />
      </Link>
    </nav>
  );
}
