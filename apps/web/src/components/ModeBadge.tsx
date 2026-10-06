import type { DeliveryMode } from "@simpuru/core";
import { ShieldCheck, Zap } from "lucide-react";

export const MODE_LABEL: Record<DeliveryMode, string> = {
  instant: "Instant",
  protected: "Protected",
};

/** Protected is the product, so it gets the filled badge; instant stays outlined. */
export default function ModeBadge({ mode }: { mode: DeliveryMode }) {
  const Icon = mode === "protected" ? ShieldCheck : Zap;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        mode === "protected" ? "bg-black text-white" : "border border-gray-300 text-gray-700"
      }`}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {MODE_LABEL[mode]}
    </span>
  );
}
