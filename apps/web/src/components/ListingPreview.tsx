"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

const VIDEO = /\.(mp4|webm)(\?|#|$)/i;

/**
 * The recording of what a prompt produces. It is the product, so it gets the
 * card's full width. Video autoplays muted and loops, but only while on screen,
 * so a grid of twenty doesn't decode twenty videos at once. Reduced motion gets
 * the first frame, no autoplay. No URL, or one that fails, renders `fallback`
 * (nothing by default).
 */
export default function ListingPreview({
  src,
  title,
  className = "",
  fallback = null,
}: {
  src?: string;
  title: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const isVideo = !!src && VIDEO.test(src);

  // Reset when the URL changes (e.g. typing in the seller form).
  const [shown, setShown] = useState(src);
  if (shown !== src) {
    setShown(src);
    setFailed(false);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-observe when the <video> element is swapped
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isVideo, shown]);

  if (!src || failed) return fallback;

  return (
    <div className={`overflow-hidden bg-gray-100 ${className}`}>
      {isVideo ? (
        <video
          ref={video}
          // #t asks the browser to paint the first frame before playback, standing in for a poster.
          src={src.includes("#") ? src : `${src}#t=0.001`}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`Preview of ${title}`}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        // Plain <img>: animated webp/gif from any host; next/image would freeze or reject it.
        // biome-ignore lint/performance/noImgElement: animated remote media, see above
        <img
          src={src}
          alt={`Preview of ${title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
