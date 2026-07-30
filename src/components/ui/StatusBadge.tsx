import { cn } from "@/lib/cn";
import { STATUS_META, type ShipmentStatus, type StatusTone } from "@/lib/tracking/status";

/**
 * Green is reserved for delivered, amber for states needing attention, red for
 * stopped, blue for moving and grey for pre-pickup. Colour is never the only
 * signal: the label always states the status in words.
 */
const TONES: Record<StatusTone, string> = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  moving: "bg-sky-accent-50 text-sky-accent-700 ring-sky-accent-100",
  delivered: "bg-go-50 text-go-700 ring-go-100",
  attention: "bg-warn-50 text-warn-700 ring-warn-100",
  stopped: "bg-brand-50 text-brand-700 ring-brand-100",
};

const DOT_TONES: Record<StatusTone, string> = {
  neutral: "bg-ink-400",
  moving: "bg-sky-accent-600",
  delivered: "bg-go-600",
  attention: "bg-warn-600",
  stopped: "bg-brand-600",
};

export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: ShipmentStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        TONES[meta.tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_TONES[meta.tone])} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
