"use client";

import { ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import CopyButton from "@/components/CopyButton";
import Modal from "@/components/Modal";
import { useSession } from "@/components/SessionProvider";
import { purchaseContent } from "@/lib/account";

/**
 * The prompt a buyer owns. Pass `content` when it's already in hand (right after buying), or
 * `purchaseId` to fetch it (`GET /me/purchases/:id/content`, buyer only).
 */
export default function ContentModal({
  open,
  onClose,
  title,
  purchaseId,
  content: given,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  purchaseId?: string;
  content?: string;
}) {
  const { guard } = useSession();
  const [content, setContent] = useState<string | null>(given ?? null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (given !== undefined) {
      setContent(given);
      return;
    }
    if (!purchaseId) return;
    let cancelled = false;
    setContent(null);
    setError("");
    guard((t) => purchaseContent(t, purchaseId))
      .then((c) => !cancelled && setContent(c))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Couldn't open it."));
    return () => {
      cancelled = true;
    };
  }, [open, purchaseId, given, guard]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          {error}
        </p>
      ) : content === null ? (
        <p className="inline-flex items-center gap-2 text-sm text-gray-600">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Opening…
        </p>
      ) : (
        <div className="space-y-3">
          <pre className="max-h-80 overflow-auto rounded-xl bg-gray-50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {content}
          </pre>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CopyButton text={content} label="prompt" />
            {purchaseId && (
              <Link
                href={`/purchases/${purchaseId}`}
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Purchase timeline
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
