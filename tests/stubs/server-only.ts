/**
 * Stub for the `server-only` package.
 *
 * The real package throws unless it is resolved through React's "react-server"
 * export condition, which Vitest does not set. Aliasing it to this empty module
 * lets a server-only helper such as the rate limiter be unit tested directly.
 * It changes nothing about the application build, where Next.js still enforces
 * the real boundary.
 */

export {};
