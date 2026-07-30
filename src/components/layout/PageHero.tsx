import type { ReactNode } from "react";

import { AnimatedHeading } from "@/components/ui/Motion";
import { Container } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";

/**
 * Shared hero for the interior pages, so /services and /legal/terms open the
 * same way. Only the home page departs from this, because it carries the
 * tracking field.
 */
export function PageHero({
  eyebrow,
  title,
  highlight,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-ink-200 bg-gradient-to-b from-ink-50 to-white", className)}>
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">
            {eyebrow}
          </p>
          <AnimatedHeading
            text={title}
            highlight={highlight}
            className="mt-4 text-3xl leading-[1.12] font-bold tracking-tight text-ink-900 sm:text-[2.75rem]"
          />
          {description ? (
            <div className="mt-5 text-lg leading-relaxed text-ink-600">{description}</div>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}

/** Long form body copy with consistent rhythm across the content pages. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 text-[15px] leading-[1.75] text-ink-600",
        "[&_strong]:font-semibold [&_strong]:text-ink-800",
        "[&_a]:font-semibold [&_a]:text-brand-600 hover:[&_a]:text-brand-700",
        className,
      )}
    >
      {children}
    </div>
  );
}
