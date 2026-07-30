import { formatDateTime } from "@/lib/format";
import { buildRouteGeometry, MAP_WIDTH } from "@/lib/tracking/route-geometry";
import type { TrackedShipment } from "@/lib/tracking/shipment";
import { STATUS_META } from "@/lib/tracking/status";
import { WORLD_MAP_PATH } from "@/lib/tracking/world-map";
import { InfoIcon, PlaneIcon } from "@/components/ui/icons";

/**
 * The route map panel.
 *
 * A faint world silhouette, the origin and destination pinned at their real
 * coordinates, and a dashed arc between them. The travelled portion is drawn
 * solid, and an aircraft marker sits at the shipment's progress along the route.
 *
 * The marker moves only when the shipment is genuinely in motion, and the
 * caption states plainly that this is built from scan events rather than a live
 * position, so nothing here implies GPS the product does not have.
 */
export function RouteMap({ shipment }: { shipment: TrackedShipment }) {
  const geometry = buildRouteGeometry(
    shipment.origin,
    shipment.destination,
    shipment.journeyFraction,
  );

  const meta = STATUS_META[shipment.status];
  const latest = shipment.latestEvent;
  const { viewBox } = geometry;

  // The backdrop is tiled across whichever world copies the crop actually spans,
  // derived from the viewBox rather than hardcoded, so an eastbound route that
  // crosses the seam never exposes empty space beside the map.
  const firstTile = Math.floor(viewBox.x / MAP_WIDTH);
  const lastTile = Math.floor((viewBox.x + viewBox.width) / MAP_WIDTH);
  const tileOffsets = Array.from(
    { length: lastTile - firstTile + 1 },
    (_, index) => (firstTile + index) * MAP_WIDTH,
  );

  // Label offsets are expressed in viewBox units, which change with the crop,
  // so they are scaled to stay visually constant at any zoom level.
  const scale = viewBox.width / 1000;
  const u = (value: number) => value * Math.max(0.55, Math.min(1.6, scale));

  return (
    <figure className="overflow-hidden rounded-card border border-ink-200 bg-white">
      <div className="relative bg-gradient-to-b from-[#f4f7fb] to-[#eef2f7]">
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="block h-[290px] w-full sm:h-[330px]"
          role="img"
          aria-label={`Route map from ${shipment.origin.label} to ${shipment.destination.label}. Current status: ${meta.label}.`}
        >
          {/* Landmasses. Low contrast on purpose: this is a backdrop, not the
              subject. */}
          {tileOffsets.map((offset) => (
            <g key={offset} transform={`translate(${offset} 0)`}>
              <path d={WORLD_MAP_PATH} fill="#d7dfea" fillRule="evenodd" opacity="0.75" />
              <path
                d={WORLD_MAP_PATH}
                fill="none"
                stroke="#c3cedd"
                strokeWidth={u(1.2)}
                fillRule="evenodd"
              />
            </g>
          ))}

          {/* Full route, then the travelled portion over it. */}
          <path
            d={geometry.path}
            fill="none"
            stroke="#e9909a"
            strokeWidth={u(3)}
            strokeDasharray={`${u(9)} ${u(9)}`}
            strokeLinecap="round"
          />
          {/* pathLength=1 normalises the arc, so a dash of the progress fraction
              followed by a gap of 1 reveals exactly the travelled portion. */}
          <path
            d={geometry.path}
            fill="none"
            stroke="#d91f2e"
            strokeWidth={u(3.4)}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${shipment.journeyFraction} 1`}
          />

          <RoutePin
            point={geometry.from}
            city={shipment.origin.city ?? shipment.origin.label}
            country={shipment.origin.countryName}
            scale={u}
            reached
            align="end"
          />
          <RoutePin
            point={geometry.to}
            city={shipment.destination.city ?? shipment.destination.label}
            country={shipment.destination.countryName}
            scale={u}
            reached={shipment.status === "delivered"}
          />

          {shipment.isMoving ? (
            <g
              transform={`translate(${geometry.marker.x.toFixed(2)} ${geometry.marker.y.toFixed(2)}) rotate(${geometry.markerAngle.toFixed(1)}) scale(${u(1)})`}
            >
              <circle r={22} fill="#d91f2e" opacity="0.12" className="motion-safe:animate-ping" />
              {/* Drawn nose-right so the tangent rotation points it along the arc. */}
              <path
                d="M20 0 -6 -11 -2 -2 -14 -2 -18 -7 -21 -7 -18 0 -21 7 -18 7 -14 2 -2 2 -6 11Z"
                fill="#d91f2e"
              />
            </g>
          ) : null}
        </svg>

        {/* Latest scan card, centred over the map as in the reference layout. */}
        {latest ? (
          <div className="absolute inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[19rem]">
            <div className="rounded-xl border border-ink-200 bg-white/97 px-4 py-3 shadow-raised backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
                <PlaneIcon className="size-[18px] text-brand-600" />
                {meta.label}
              </p>
              <p className="mt-1.5 truncate text-sm text-ink-700">{latest.title}</p>
              <p className="mt-0.5 text-sm text-ink-500">
                <time dateTime={latest.occurredAt}>{formatDateTime(latest.occurredAt)}</time>
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <figcaption className="flex items-start gap-2 border-t border-ink-100 px-4 py-3 text-xs leading-relaxed text-ink-500">
        <InfoIcon className="mt-px size-4 shrink-0 text-ink-400" />
        <span>
          Route built from recorded scan events.
          {geometry.usesRealCoordinates
            ? " Cities are placed at their real coordinates, routed eastbound."
            : " Coordinates are not on file for this shipment, so the endpoints are shown schematically."}{" "}
          SwiftTrack does not publish live GPS positions. The latest confirmed scan is shown above.
        </span>
      </figcaption>
    </figure>
  );
}

function RoutePin({
  point,
  city,
  country,
  reached,
  align = "start",
  scale,
}: {
  point: { x: number; y: number };
  city: string;
  country: string | null;
  reached: boolean;
  align?: "start" | "end";
  scale: (value: number) => number;
}) {
  const colour = reached ? "#16a34a" : "#d91f2e";
  const anchor = align === "start" ? "end" : "start";
  const labelX = align === "start" ? point.x - scale(16) : point.x + scale(16);

  return (
    <g>
      {/* Concentric ground rings, echoing the reference design. */}
      <circle cx={point.x} cy={point.y} r={scale(20)} fill={colour} opacity="0.1" />
      <circle cx={point.x} cy={point.y} r={scale(11)} fill={colour} opacity="0.18" />

      <g transform={`translate(${point.x} ${point.y}) scale(${scale(1)})`}>
        <path
          d="M0 2C0 2 -13 -11.5 -13 -20a13 13 0 0 1 26 0C13 -11.5 0 2 0 2Z"
          fill={colour}
        />
        <circle cx="0" cy="-20" r="4.8" fill="#ffffff" />
      </g>

      <text
        x={labelX}
        y={point.y - scale(26)}
        textAnchor={anchor}
        fill="#14181f"
        style={{ fontSize: scale(21), fontWeight: 700, letterSpacing: scale(0.4) }}
      >
        {city.toUpperCase()}
      </text>
      {country ? (
        <text
          x={labelX}
          y={point.y - scale(8)}
          textAnchor={anchor}
          fill="#5b6470"
          style={{ fontSize: scale(15), fontWeight: 500 }}
        >
          {country}
        </text>
      ) : null}
    </g>
  );
}
