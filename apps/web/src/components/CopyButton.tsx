"use client";

import { Check, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";

type Result = "copied" | "failed" | null;

/** How long the "Copied" / "Failed" confirmation stays before the button resets. */
const SHOW_FOR_MS = 2000;

/**
 * Puts `text` on the clipboard. The outcome is spoken (aria-live) as well as shown, and a refusal
 * (no permission, insecure page) says so instead of pretending it worked.
 */
export default function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  /** What gets copied, e.g. "content hash": used in the accessible name and the announcement. */
  label: string;
  className?: string;
}) {
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), SHOW_FOR_MS);
    return () => clearTimeout(t);
  }, [result]);

  const onClick = () =>
    navigator.clipboard.writeText(text).then(
      () => setResult("copied"),
      () => setResult("failed"),
    );

  const Icon = result === "copied" ? Check : result === "failed" ? X : Copy;
  const text_ = result === "copied" ? "Copied" : result === "failed" ? "Failed" : "Copy";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Copy ${label}`}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none"
      }
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {text_}
      <span aria-live="polite" className="sr-only">
        {result === "copied"
          ? `Copied ${label}`
          : result === "failed"
            ? `Couldn't copy ${label}`
            : ""}
      </span>
    </button>
  );
}
