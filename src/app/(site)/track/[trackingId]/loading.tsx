import { Card, Container } from "@/components/ui/Surface";

/**
 * Skeleton matching the tracking result layout, so the page does not jump when
 * the real content arrives.
 */
export default function TrackingLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="flex animate-pulse flex-col gap-5" aria-hidden="true">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <div className="h-8 w-64 rounded bg-ink-100" />
            <div className="h-4 w-80 rounded bg-ink-100" />
          </div>
          <Card className="h-20" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <Card className="h-[330px]" />
            <Card className="h-80" />
          </div>
          <div className="flex flex-col gap-5">
            <Card className="h-[520px]" />
            <Card className="h-28" />
          </div>
        </div>
      </div>

      <p role="status" className="sr-only-focusable absolute">
        Loading shipment tracking.
      </p>
    </Container>
  );
}
