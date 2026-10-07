import Image from "next/image";
import Link from "next/link";
import { ACCOUNT_URL, FAUCET_URL } from "@/lib/links";

/**
 * Logo on the left; on the right, the network badge and Sign in.
 *
 * Simpuru runs on Cardano preprod only, so the badge is always visible. It
 * opens a two-line note with the faucet link, built on <details> so the nav
 * stays a server component with no state of its own.
 *
 * Sign in happens in the app (connect a CIP-30 wallet, sign one message), so
 * the button goes there instead of running a wallet flow on the landing.
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

      <div className="flex items-center gap-2 sm:gap-3">
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-amber-900 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none sm:text-sm [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Testnet · preprod
          </summary>
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-4 text-left text-sm leading-relaxed text-gray-700 shadow-lg">
            <p className="mb-2 font-medium text-black">What&apos;s preprod?</p>
            <p className="mb-3">
              Cardano&apos;s test network. Test ADA has no value, so nothing here costs real money.
            </p>
            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-black underline underline-offset-4"
            >
              Get test ADA from the faucet
            </a>
          </div>
        </details>

        <a
          href={ACCOUNT_URL}
          className="rounded-full bg-black px-4 py-1.5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Sign in
        </a>
      </div>
    </nav>
  );
}
