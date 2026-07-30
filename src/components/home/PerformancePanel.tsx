import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Surface";
import { CountUp, Reveal } from "@/components/ui/Motion";
import { StarIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { getServicePerformance } from "@/lib/data/ratings";

/**
 * Live service performance.
 *
 * Every number is computed by the database from real shipment and rating rows.
 * There are no seeded figures and no fallbacks that invent a flattering value:
 * when a metric has no data behind it, the tile says so. That is the whole point
 * of the panel, so it is worth stating plainly in the UI too.
 */
export async function PerformancePanel() {
  const performance = await getServicePerformance();

  if (performance.isEmpty) {
    return (
      <Alert tone="info" title="No completed deliveries yet">
        Performance figures appear here once shipments have been delivered and customers have rated
        them. We publish these numbers from our operational database rather than estimating them, so
        this panel stays empty until there is something real to show.
      </Alert>
    );
  }

  const stars = performance.averageStars;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Reveal>
        <MetricCard
          label="Deliveries completed"
          available={performance.deliveredCount > 0}
          note="Shipments delivered and closed."
        >
          <CountUp value={performance.deliveredCount} />
        </MetricCard>
      </Reveal>

      <Reveal delay={60}>
        <MetricCard
          label="Delivered on time"
          available={performance.onTimePercent !== null}
          note="Delivered on or before the estimated date, across shipments that carried an estimate."
        >
          <CountUp value={performance.onTimePercent ?? 0} suffix="%" decimals={1} />
        </MetricCard>
      </Reveal>

      <Reveal delay={120}>
        <MetricCard
          label="Average transit"
          available={performance.averageTransitDays !== null}
          note="Days from pickup scan to delivery scan."
        >
          <>
            <CountUp value={performance.averageTransitDays ?? 0} decimals={1} />
            <span className="ml-1 text-lg font-semibold text-ink-500">days</span>
          </>
        </MetricCard>
      </Reveal>

      <Reveal delay={180}>
        <MetricCard
          label="Customer rating"
          available={stars !== null}
          note={
            performance.ratingCount === 1
              ? "From 1 rated delivery."
              : `From ${performance.ratingCount} rated deliveries.`
          }
        >
          <span className="flex items-baseline gap-2">
            <CountUp value={stars ?? 0} decimals={1} />
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <StarIcon
                  key={value}
                  filled={stars !== null && value <= Math.round(stars)}
                  className={cn(
                    "size-4",
                    stars !== null && value <= Math.round(stars)
                      ? "text-warn-600"
                      : "text-ink-300",
                  )}
                />
              ))}
            </span>
          </span>
        </MetricCard>
      </Reveal>
    </div>
  );
}

function MetricCard({
  label,
  note,
  available,
  children,
}: {
  label: string;
  note: string;
  available: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full p-6">
      <p className="text-xs font-semibold tracking-[0.1em] text-ink-500 uppercase">{label}</p>

      {available ? (
        <p className="mt-3 text-4xl font-bold tracking-tight text-ink-900">{children}</p>
      ) : (
        <p className="mt-3 text-lg font-semibold text-ink-400">Not enough data yet</p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-ink-500">{note}</p>
    </Card>
  );
}
