"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { CheckIcon, CopyIcon, ShareIcon } from "@/components/ui/icons";

type CopyState = "idle" | "copied" | "failed";

/**
 * Copies text to the clipboard with confirmation.
 *
 * The clipboard API needs a secure context and a user gesture, and it can still
 * be refused. Failure is reported to the visitor rather than silently swallowed,
 * so they know to select the text manually.
 */
export function CopyButton({
  value,
  label,
  copiedLabel = "Copied",
  variant = "icon",
  className,
}: {
  value: string;
  label: string;
  copiedLabel?: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setState("idle"), 2400);
  }

  const message =
    state === "copied" ? copiedLabel : state === "failed" ? "Press Ctrl+C to copy" : label;

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-control border border-ink-200 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-700",
            state === "copied" && "border-go-100 bg-go-50 text-go-600",
            className,
          )}
        >
          {state === "copied" ? <CheckIcon className="size-5" /> : <CopyIcon className="size-5" />}
          <span className="sr-only-focusable absolute">{label}</span>
        </button>
        <span role="status" aria-live="polite" className="sr-only-focusable absolute">
          {state === "idle" ? "" : message}
        </span>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-control border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50",
        state === "copied" && "border-go-100 bg-go-50 text-go-700",
        className,
      )}
    >
      {state === "copied" ? <CheckIcon className="size-4" /> : <ShareIcon className="size-4" />}
      <span aria-live="polite">{message}</span>
    </button>
  );
}
