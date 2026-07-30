/**
 * Joins class names, dropping falsy values.
 *
 * Deliberately not clsx or tailwind-merge: the component set here composes
 * classes by position rather than relying on conflict resolution, so a 1kB
 * dependency would buy nothing.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
