"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Surface";
import { AlertIcon } from "@/components/ui/icons";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error in operations area", error);
  }, [error]);

  const permissionDenied = error.message.toLowerCase().includes("read-only");

  return (
    <Card className="p-8 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <AlertIcon className="size-6" />
      </span>
      <h1 className="mt-4 text-xl font-bold tracking-tight text-ink-900">
        {permissionDenied ? "You do not have permission for that" : "Something went wrong"}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
        {permissionDenied
          ? "Your account has read-only access to this area. Ask an owner to change your role if you need to make changes."
          : "The action could not be completed. Try again, and if it keeps happening let an owner know."}
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-ink-400">
          Reference <span data-numeric>{error.digest}</span>
        </p>
      ) : null}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/admin" variant="secondary">
          Back to overview
        </ButtonLink>
      </div>
    </Card>
  );
}
