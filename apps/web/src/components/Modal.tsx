"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

/** A centred dialog over a dimmed page. Esc and the backdrop close it, unless `locked`. */
export default function Modal({
  open,
  onClose,
  title,
  children,
  locked = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** While something is in flight (a payment), the dialog can't be dismissed. */
  locked?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose();
      }}
      onClose={() => {
        // The browser can close a dialog on its own (Esc twice); keep React state in step.
        if (!open) return;
        if (locked) dialog.current?.showModal();
        else onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current && !locked) onClose();
      }}
      onKeyDown={() => {}}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-black shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            {!locked && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            )}
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
