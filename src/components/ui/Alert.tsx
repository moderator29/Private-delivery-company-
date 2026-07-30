import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { AlertIcon, CheckCircleIcon, InfoIcon } from "@/components/ui/icons";

type AlertTone = "info" | "success" | "warning" | "error";

const TONES: Record<AlertTone, { wrapper: string; icon: string }> = {
  info: { wrapper: "border-sky-accent-100 bg-sky-accent-50 text-sky-accent-700", icon: "text-sky-accent-600" },
  success: { wrapper: "border-go-100 bg-go-50 text-go-700", icon: "text-go-600" },
  warning: { wrapper: "border-warn-100 bg-warn-50 text-warn-700", icon: "text-warn-600" },
  error: { wrapper: "border-brand-100 bg-brand-50 text-brand-700", icon: "text-brand-600" },
};

const ICONS: Record<AlertTone, typeof InfoIcon> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertIcon,
  error: AlertIcon,
};

/**
 * Inline feedback. Success and error messages are announced: role="status" for
 * success so it does not interrupt, role="alert" for errors so it does.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const styles = TONES[tone];
  const Icon = ICONS[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-control border px-4 py-3", styles.wrapper, className)}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", styles.icon)} />
      <div className="min-w-0 text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5", "leading-relaxed")}>{children}</div> : null}
      </div>
    </div>
  );
}
