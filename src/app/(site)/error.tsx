"use client";

import { useEffect } from "react";

import { ButtonLink, Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Surface";
import { AlertIcon } from "@/components/ui/icons";

/**
 * Route level error boundary for the public site.
 *
 * The error object is logged rather than rendered: a stack trace or a database
 * message on a customer facing page tells an attacker about the internals and
 * tells the customer nothing useful.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error on public site", error);
  }, [error]);

  return (
    <Container className="py-20 text-center sm:py-28">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <AlertIcon className="size-7" />
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-600">
        This is a problem on our side, not with anything you did. Try again in a moment, or contact
        our support team if it keeps happening.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-ink-400">
          Reference <span data-numeric>{error.digest}</span>
        </p>
      ) : null}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/contact" size="lg" variant="secondary">
          Contact support
        </ButtonLink>
      </div>
    </Container>
  );
}
