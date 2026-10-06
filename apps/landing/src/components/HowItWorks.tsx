type Step = { title: string; line: string; video: string; overlay: string; height: string };

/**
 * Three steps, a few words each. The cards follow the MotionSites "Veloce
 * Cards" layout: looping video backgrounds under a soft tint, with the middle
 * card shorter so the row steps down on desktop.
 *
 * Videos are the prompt's own clips, re-encoded to 720p without audio and kept
 * in public/media so the page does not depend on someone else's CDN.
 */
const STEPS: Step[] = [
  {
    title: "Pick a prompt",
    line: "Your agent finds the one it needs.",
    video: "/media/step-1",
    overlay: "bg-[rgba(206,223,235,0.25)]",
    height: "min-h-[320px] lg:min-h-[420px]",
  },
  {
    title: "Pay a few ADA",
    line: "The money waits until it arrives.",
    video: "/media/step-2",
    overlay: "bg-[rgba(247,236,233,0.6)]",
    height: "min-h-[320px] lg:min-h-[340px]",
  },
  {
    title: "Get it, or get it back",
    line: "No prompt, no payment.",
    video: "/media/step-3",
    overlay: "bg-[rgba(218,218,218,0.2)]",
    height: "min-h-[320px] lg:min-h-[420px]",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 sm:gap-16">
        <div data-reveal className="max-w-xl">
          <p className="mb-3 text-xs font-medium tracking-widest text-gray-500 uppercase">
            How it works
          </p>
          <h2 className="text-4xl leading-[1.05] font-normal tracking-tight text-[#141414] sm:text-5xl md:text-6xl">
            Paid only when it arrives
          </h2>
        </div>

        <ol
          data-reveal-group
          className="flex flex-col items-stretch gap-5 lg:flex-row lg:items-end"
        >
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={`relative flex flex-1 flex-col justify-between overflow-hidden rounded-[32px] p-8 sm:rounded-[40px] sm:p-10 ${step.height}`}
            >
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                poster={`${step.video}.jpg`}
                aria-hidden
              >
                <source src={`${step.video}.mp4`} type="video/mp4" />
              </video>
              <div className={`absolute inset-0 ${step.overlay}`} />

              <span className="relative z-10 font-mono text-sm text-[#141414]/50">
                0{index + 1}
              </span>
              <div className="relative z-10 flex flex-col gap-3">
                <h3 className="text-3xl leading-none font-medium tracking-tight text-[#141414] sm:text-4xl">
                  {step.title}
                </h3>
                <p className="text-base text-[#49484F] sm:text-lg">{step.line}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
