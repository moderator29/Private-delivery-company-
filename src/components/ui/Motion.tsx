"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Reveals its children when they scroll into view.
 *
 * Uses IntersectionObserver rather than a scroll listener, so there is no work
 * on the main thread between intersections. If the API is unavailable, or the
 * visitor prefers reduced motion, the content is shown immediately: the
 * animation is an enhancement and must never be load-bearing for visibility.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!node || reducedMotion || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      // Starts slightly before the element reaches the viewport, so the motion
      // finishes about when the reader arrives at it.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", visible && "reveal-visible", className)}
      style={visible && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * A heading whose words rise into place one after another.
 *
 * The full text stays in the accessible name via aria-label, and the individual
 * word spans are hidden from assistive technology, so a screen reader announces
 * one clean sentence rather than a stream of fragments.
 */
export function AnimatedHeading({
  text,
  className,
  as: Tag = "h1",
  highlight,
}: {
  text: string;
  className?: string;
  as?: ElementType;
  /** Word or phrase rendered in brand red with a drawn underline. */
  highlight?: string;
}) {
  const words = text.split(" ");
  const highlightWords = highlight ? highlight.split(" ") : [];
  const highlightStart = highlight
    ? words.findIndex((_, index) =>
        highlightWords.every((word, offset) => words[index + offset] === word),
      )
    : -1;

  return (
    <Tag className={cn("[text-wrap:balance]", className)} aria-label={text}>
      {words.map((word, index) => {
        const isHighlighted =
          highlightStart >= 0 &&
          index >= highlightStart &&
          index < highlightStart + highlightWords.length;

        return (
          <span
            key={`${word}-${index}`}
            aria-hidden="true"
            className="inline-block overflow-hidden pb-[0.08em] align-bottom"
          >
            <span
              className={cn(
                "inline-block motion-safe:animate-[rise-word_.6s_var(--ease-out-soft)_both]",
                isHighlighted && "relative text-brand-600",
                isHighlighted && index === highlightStart + highlightWords.length - 1
                  ? "animated-underline"
                  : null,
              )}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              {word}
            </span>
            {index < words.length - 1 ? <span>&nbsp;</span> : null}
          </span>
        );
      })}
    </Tag>
  );
}

/**
 * Counts up to a value when scrolled into view. Used for the live performance
 * figures, which are real numbers from the database rather than decoration.
 */
export function CountUp({
  value,
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = ref.current;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!node || reducedMotion || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const duration = 900;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          // Ease out cubic, so the number settles rather than stopping dead.
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(value * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        setDisplay(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className={className} data-numeric>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
