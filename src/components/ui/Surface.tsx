import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * The one card treatment used across the product: white, hairline border, soft
 * shadow. Consistency here is most of what makes the interface feel like one
 * system rather than a collection of screens.
 */
export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-ink-200 bg-white shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Page section wrapper with the shared max width and horizontal padding. */
export function Container({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
      {description ? <p className="text-base leading-relaxed text-ink-600">{description}</p> : null}
    </div>
  );
}

/** Definition-list row used by the shipment detail panels. */
export function DetailRow({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: ReactNode;
  emphasis?: "default" | "success";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-semibold",
          emphasis === "success" ? "text-go-700" : "text-ink-800",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
