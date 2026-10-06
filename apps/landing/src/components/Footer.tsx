import SponsorMarquee from "@/components/SponsorMarquee";

/**
 * The strip pinned to the bottom of the hero.
 *
 * It says what the thing is built on: the chain, the payment protocol, the
 * escrow, and the event it was built for.
 */
export default function Footer() {
  return (
    <footer
      className="animate-fade-in-up absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-4 sm:gap-4 sm:pb-8"
      style={{ animationDelay: "0.6s", opacity: 0 }}
    >
      <SponsorMarquee />
    </footer>
  );
}
