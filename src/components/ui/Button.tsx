import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * Minimum 44px tall at md and lg so touch targets stay comfortable on mobile.
 * sm is reserved for dense admin table rows where it sits inside a larger row.
 */
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-subtle hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary:
    "bg-white text-ink-700 border border-ink-200 shadow-subtle hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 disabled:text-ink-400",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100 hover:text-ink-800 disabled:text-ink-400",
  danger:
    "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 active:bg-brand-100 disabled:text-brand-300",
};

const BASE =
  "inline-flex items-center justify-center rounded-control font-semibold transition-colors duration-150 disabled:cursor-not-allowed select-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export type ButtonProps = CommonProps & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export type ButtonLinkProps = CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">;

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
