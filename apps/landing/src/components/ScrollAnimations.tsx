"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-driven in/out for every section below the hero.
 *
 * Mark an element with `data-reveal` to have it rise and sharpen into place as
 * it enters the viewport, or `data-reveal-group` to do the same for each of its
 * children in turn. Both play forward on the way down and reverse when the
 * element scrolls back out, in either direction, so sections ease in and out
 * instead of popping.
 *
 * Renders nothing. Reduced motion skips every tween, so the page stays fully
 * visible and still.
 */
export default function ScrollAnimations() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const from = { autoAlpha: 0, y: 48, filter: "blur(8px)" };
      const to = {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1,
        ease: "power3.out",
      };
      // Enter from below, leave upwards, re-enter from above, leave downwards.
      const toggleActions = "play reverse play reverse";

      for (const element of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
        gsap.fromTo(element, from, {
          ...to,
          scrollTrigger: { trigger: element, start: "top 88%", end: "bottom 12%", toggleActions },
        });
      }

      for (const group of gsap.utils.toArray<HTMLElement>("[data-reveal-group]")) {
        gsap.fromTo(group.children, from, {
          ...to,
          stagger: 0.12,
          scrollTrigger: { trigger: group, start: "top 88%", end: "bottom 12%", toggleActions },
        });
      }
    });

    return () => mm.revert();
  });

  return null;
}
