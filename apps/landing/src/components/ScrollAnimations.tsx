"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Smooth scrolling plus scroll-linked in/out for every section below the hero.
 *
 * Lenis smooths the page scroll itself and is driven from GSAP's ticker, so
 * ScrollTrigger always reads the same eased position the reader sees.
 *
 * Mark an element with `data-reveal`, or `data-reveal-group` to stagger its
 * children. Each one rises in as it enters the bottom of the screen and drifts
 * out as it leaves the top. The tween is tied to the scroll position
 * (`scrub`) rather than played on a trigger, so it moves exactly as fast as the
 * reader scrolls, in both directions, with a short catch-up for softness.
 *
 * Only transform and opacity are animated: both stay on the compositor, so the
 * motion does not stutter on long pages with video behind it.
 *
 * Reduced motion: no smoothing and no tweens; the page stays still and visible.
 */
export default function ScrollAnimations() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const animate = (
        targets: HTMLElement | HTMLCollection,
        trigger: HTMLElement,
        stagger = 0,
      ) => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
        // In over the first 35% of the pass, hold, then out over the last 20%.
        timeline
          .fromTo(
            targets,
            { autoAlpha: 0, y: 80, scale: 0.97 },
            { autoAlpha: 1, y: 0, scale: 1, ease: "power2.out", duration: 0.35, stagger },
          )
          .to(targets, { duration: 0.45 })
          .to(targets, { autoAlpha: 0, y: -40, ease: "power1.in", duration: 0.2, stagger });
      };

      for (const element of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
        animate(element, element);
      }
      for (const group of gsap.utils.toArray<HTMLElement>("[data-reveal-group]")) {
        animate(group.children, group, 0.06);
      }

      return () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });

    return () => mm.revert();
  });

  return null;
}
