"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Entry = { speaker: "agent" | "simpuru"; text: string; showsWork?: boolean };

/** What the prompt in this exchange produces. */
const PROMPT_PREVIEW = "/media/preview.webp";

/**
 * The protected path, end to end: the agent asks for a design, Simpuru quotes a
 * listing in ADA, the agent pays into escrow, and the delivery is checked
 * against the hash the seller committed to before anyone is paid.
 */
const TRANSCRIPT: Entry[] = [
  { speaker: "agent", text: "create one landing page" },
  {
    speaker: "simpuru",
    text: "Cinematic scroll-scrubbed landing page prompt. 5 tADA. Instant, or protected by escrow?",
  },
  { speaker: "agent", text: "protected" },
  {
    speaker: "simpuru",
    text: "Paid into escrow. Delivery matches the committed hash. Here's the web:",
    showsWork: true,
  },
];

const SPEAKER = { agent: "your agent", simpuru: "Simpuru" } as const;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Types the transcript out once, the first time it scrolls into view.
 *
 * A pause before each Simpuru reply is what makes it read as an exchange rather
 * than as text appearing. It plays once: a transcript that loops forever
 * competes with the prose around it for the reader's attention.
 *
 * Reduced motion gets the finished transcript immediately. Cancelling the
 * animation without filling it in would leave the section permanently blank.
 */
function useTypedTranscript(active: boolean) {
  const [typed, setTyped] = useState<string[]>(() => TRANSCRIPT.map(() => ""));
  const [typingIndex, setTypingIndex] = useState(-1);
  const [thinking, setThinking] = useState(false);
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (delay: number, run: () => void) => {
      timers.push(setTimeout(run, delay));
    };

    if (reducedMotion()) {
      at(0, () => setTyped(TRANSCRIPT.map((entry) => entry.text)));
      return () => {
        for (const timer of timers) clearTimeout(timer);
      };
    }

    let clock = 0;
    TRANSCRIPT.forEach((entry, index) => {
      if (entry.speaker === "simpuru") {
        at(clock, () => setThinking(true));
        clock += 700;
        at(clock, () => setThinking(false));
      }
      at(clock, () => setTypingIndex(index));
      const perCharacter = 18;
      for (let n = 1; n <= entry.text.length; n += 1) {
        at(clock + n * perCharacter, () =>
          setTyped((previous) => {
            if (previous[index]?.length === n) return previous;
            const next = [...previous];
            next[index] = entry.text.slice(0, n);
            return next;
          }),
        );
      }
      clock += entry.text.length * perCharacter + 420;
    });
    at(clock, () => setTypingIndex(-1));

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [active]);

  return { typed, typingIndex, thinking };
}

/** One-shot in-view flag, so the transcript starts when it is actually read. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      // jsdom and any browser without it: show the section rather than hide it.
      setTimeout(() => setInView(true), 0);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}

/** A plain person mark for the agent's side of the conversation. */
function AgentAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a]">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-4 w-4"
        fill="none"
        stroke="#f2f2f2"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Simpuru's side: a gradient disc in the section's lilac and sky tones. */
function SimpuruAvatar() {
  return (
    <span
      aria-hidden
      className="h-8 w-8 shrink-0 rounded-full"
      style={{
        background: "linear-gradient(105deg, #b9a7f0 0%, #9d8ae0 40%, #8fb8ea 70%, #bfe0f5 100%)",
      }}
    />
  );
}

/**
 * What buying a prompt looks like from inside an agent.
 *
 * Layout follows the chat panel of the MotionSites "DeepThink" prompt: a dark
 * chat card inside a soft gradient panel, avatars on each side, a "live" dot,
 * and a pill input at the bottom. The panel is recoloured from yellow/teal to
 * the lilac and sky of the sections above. All of it is CSS and inline SVG.
 */
export default function ChatDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const { typed, typingIndex, thinking } = useTypedTranscript(inView);

  return (
    <section ref={ref} className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-[1300px]">
        <h2 className="mb-4 text-3xl leading-[1.11] font-normal tracking-[-0.02em] text-[#141414] sm:text-4xl md:text-5xl">
          One line in.
          <br />
          <span className="text-[#8b8b8d]">A protected prompt out.</span>
        </h2>
        <p className="mb-10 max-w-xl text-base text-[#6b6b6d] sm:mb-12 sm:text-lg">
          No checkout, no card. No prompt, no payment.
        </p>

        <div
          className="relative overflow-hidden rounded-[14px] px-3 py-6 sm:px-10 sm:py-10"
          style={{
            background: [
              "radial-gradient(120% 150% at 9% 52%, #b7a6ee 0%, #a796e2 22%, rgba(167,150,226,0) 56%)",
              "radial-gradient(120% 150% at 95% 50%, #9cc4ee 0%, #86b2e4 34%, rgba(134,178,228,0) 64%)",
              "radial-gradient(80% 110% at 42% 6%, rgba(236,214,240,0.7) 0%, rgba(236,214,240,0) 42%)",
              "linear-gradient(96deg, #b4a3ec 0%, #c3b4ee 32%, #a9c3ec 62%, #8fb6e6 100%)",
            ].join(", "),
          }}
        >
          <div className="mb-4 flex items-center gap-2 px-1 text-sm font-medium text-[#0b0c07]">
            <span className="h-2 w-2 rounded-full bg-[#23d92c] shadow-[0_0_6px_rgba(45,220,55,0.65)]" />
            Live purchase
          </div>

          <div className="mx-auto flex max-w-[814px] flex-col gap-4 rounded-[18px] bg-[#0d0d0d] p-4 sm:p-6">
            {TRANSCRIPT.map((entry, index) => {
              const isAgent = entry.speaker === "agent";
              const shown = typed[index] ?? "";
              const started = shown.length > 0 || index === typingIndex;

              return (
                <div
                  key={entry.text}
                  className={`flex items-end gap-2.5 transition-opacity duration-300 ${
                    isAgent ? "flex-row-reverse" : ""
                  } ${started ? "opacity-100" : "opacity-0"}`}
                >
                  {isAgent ? <AgentAvatar /> : <SimpuruAvatar />}
                  <div className="flex max-w-[78%] flex-col gap-1">
                    <span
                      className={`font-mono text-[11px] text-white/40 ${isAgent ? "text-right" : ""}`}
                    >
                      {SPEAKER[entry.speaker]}
                    </span>
                    {/*
                      Every bubble is laid out from the start and only faded in,
                      so the card's height never changes while the transcript
                      types and the page does not jump under the reader.
                    */}
                    <div className="rounded-[15px] bg-[#1c1c1c] px-4 py-3 text-[15px] leading-[1.42] text-[#efefef] sm:text-base">
                      <span>{shown || entry.text}</span>
                      {index === typingIndex && (
                        <span className="ml-1 inline-block h-[0.8em] w-[0.08em] animate-pulse bg-current align-middle" />
                      )}

                      {entry.showsWork && (
                        <span
                          className={`mt-3 block overflow-hidden rounded-xl transition-opacity duration-700 ${
                            shown.length === entry.text.length ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          {/*
                            `unoptimized` on purpose: this is an animated WebP and
                            the optimizer would flatten it to a still frame.
                          */}
                          <Image
                            src={PROMPT_PREVIEW}
                            alt="The landing page this prompt produces"
                            width={1280}
                            height={720}
                            unoptimized
                            className="block aspect-[16/9] w-full object-cover"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex h-3 items-center gap-1.5 pl-11">
              {thinking &&
                [0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/50"
                    style={{ animationDelay: `${dot * 0.15}s` }}
                  />
                ))}
            </div>

            {/* Decorative: the demo has no input, it only shows what one looks like. */}
            <div
              aria-hidden
              className="flex h-12 items-center gap-3 rounded-full bg-[#fdfdfd] pr-1.5 pl-5"
            >
              <span className="flex-1 truncate text-sm text-[#6b6b6d]">
                Ask your agent for a design prompt…
              </span>
              <span className="send-ring relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-[1.5px]">
                <span className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-[#141414]">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="#fafafa"
                    strokeWidth="2"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
