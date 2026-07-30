"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Flag } from "@/components/ui/Flag";
import { CheckIcon, CloseIcon, GlobeIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { REGIONS, REGION_COOKIE, type Region } from "@/lib/regions";

/**
 * Region picker.
 *
 * Uses the native <dialog> element for showModal(), which gives focus trapping,
 * Escape to close and inertness of the page behind it without a focus-management
 * library. The trigger shows the current region so the choice is visible rather
 * than buried.
 */
export function RegionDialog({ current }: { current: Region }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function choose(region: Region) {
    // One year, lax, path-wide. No personal data: it is a display preference.
    document.cookie = `${REGION_COOKIE}=${region.code}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-control px-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
        aria-haspopup="dialog"
      >
        <GlobeIcon className="size-[18px] text-ink-400" />
        <Flag code={current.country} />
        <span className="hidden sm:inline">{current.code}</span>
        <span className="sr-only-focusable absolute">
          Change region. Currently {current.name}.
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Clicking the backdrop, which is the dialog element itself.
          if (event.target === dialogRef.current) setOpen(false);
        }}
        aria-labelledby="region-dialog-title"
        className="w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-ink-200 bg-white p-0 shadow-raised backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <h2 id="region-dialog-title" className="text-xl font-bold tracking-tight text-ink-900">
              Choose your region
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              We will show the support desk that covers you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="-mt-1 -mr-2 inline-flex size-10 items-center justify-center rounded-control text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <CloseIcon className="size-5" />
            <span className="sr-only-focusable absolute">Close</span>
          </button>
        </div>

        <ul className="max-h-[60vh] overflow-y-auto p-3">
          {REGIONS.map((region) => {
            const selected = region.code === current.code;
            return (
              <li key={region.code}>
                <button
                  type="button"
                  onClick={() => choose(region)}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition-colors",
                    selected ? "bg-brand-50" : "hover:bg-ink-50",
                  )}
                >
                  <Flag code={region.country} className="mt-0.5 shrink-0" />

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-ink-900">{region.name}</span>
                      {region.isHome ? (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 uppercase">
                          Head office
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-500">
                      {region.languages.join(", ")} - {region.supportPhone}
                    </span>
                  </span>

                  {selected ? (
                    <CheckIcon className="size-5 shrink-0 text-brand-600" />
                  ) : (
                    <span className="size-5 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="border-t border-ink-100 px-6 py-4 text-xs leading-relaxed text-ink-500">
          SwiftTrack is published in English. Additional languages are not available yet, so this
          picker changes the support desk shown to you rather than the language of the site.
        </p>
      </dialog>
    </>
  );
}
