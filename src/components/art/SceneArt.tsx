/**
 * Editorial scene artwork.
 *
 * Drawn rather than photographed. Stock photography would mean a licence, a
 * network fetch, several hundred kilobytes per card and a look that belongs to
 * whoever else bought the same image. These scenes are ours, they scale to any
 * size, they weigh about a kilobyte each and they carry the brand palette
 * without being asked to.
 *
 * Every scene shares one grammar: a soft gradient sky, a horizon, layered
 * silhouettes, and a single brand-red focal element. That is what keeps four
 * different illustrations reading as one set.
 */

type SceneName = "gateway" | "airfreight" | "handover" | "cityDelivery";

const GRADIENTS: Record<SceneName, [string, string]> = {
  gateway: ["#eef2f8", "#dde5f0"],
  airfreight: ["#f3f6fb", "#e4ecf6"],
  handover: ["#fdf1f2", "#f7e3e5"],
  cityDelivery: ["#eef3f7", "#dfe8f1"],
};

export interface SceneArtProps {
  scene: SceneName;
  className?: string;
}

export function SceneArt({ scene, className }: SceneArtProps) {
  const [from, to] = GRADIENTS[scene];
  const gradientId = `scene-${scene}`;

  return (
    <svg
      viewBox="0 0 640 360"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${gradientId}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <rect width="640" height="360" fill={`url(#${gradientId})`} />

      {scene === "gateway" ? <GatewayScene /> : null}
      {scene === "airfreight" ? <AirfreightScene /> : null}
      {scene === "handover" ? <HandoverScene /> : null}
      {scene === "cityDelivery" ? <CityDeliveryScene /> : null}

      <rect width="640" height="360" fill={`url(#${gradientId}-fade)`} />
    </svg>
  );
}

/** Sorting facility: bay doors, stacked parcels, a loading truck. */
function GatewayScene() {
  return (
    <g>
      <rect y="212" width="640" height="148" fill="#c8d3e2" />
      <rect y="212" width="640" height="5" fill="#aebdd1" />

      {/* Building shell and bay doors. */}
      <rect x="42" y="76" width="392" height="136" rx="6" fill="#dfe7f1" />
      <rect x="42" y="76" width="392" height="16" rx="4" fill="#c4d0e0" />
      {[70, 168, 266, 364].map((x) => (
        <g key={x}>
          <rect x={x} y="112" width="66" height="100" rx="4" fill="#b7c5d8" />
          {[0, 1, 2, 3, 4].map((row) => (
            <rect
              key={row}
              x={x + 5}
              y={120 + row * 18}
              width="56"
              height="11"
              rx="2"
              fill="#cbd6e5"
            />
          ))}
        </g>
      ))}

      {/* Stacked parcels waiting on the apron. */}
      <g>
        <rect x="452" y="168" width="58" height="44" rx="3" fill="#d9a463" />
        <rect x="452" y="168" width="58" height="7" rx="2" fill="#c68f4d" />
        <rect x="478" y="168" width="6" height="44" fill="#c68f4d" opacity=".55" />
        <rect x="470" y="128" width="46" height="40" rx="3" fill="#e3b071" />
        <rect x="470" y="128" width="46" height="6" rx="2" fill="#d19a58" />
      </g>

      {/* Truck at the bay, brand red so the eye lands here. */}
      <g>
        <rect x="524" y="140" width="82" height="58" rx="6" fill="#ffffff" />
        <rect x="524" y="140" width="82" height="58" rx="6" fill="none" stroke="#c2c9d4" strokeWidth="3" />
        <path d="M606 152h20l14 22v24h-34v-46Z" fill="#d91f2e" />
        <circle cx="548" cy="204" r="13" fill="#232a34" />
        <circle cx="548" cy="204" r="5" fill="#9aa3b2" />
        <circle cx="620" cy="204" r="13" fill="#232a34" />
        <circle cx="620" cy="204" r="5" fill="#9aa3b2" />
      </g>

      {/* Motion streaks. */}
      <rect x="0" y="120" width="30" height="7" rx="3.5" fill="#d91f2e" opacity=".3" />
      <rect x="8" y="138" width="46" height="7" rx="3.5" fill="#d91f2e" opacity=".18" />
    </g>
  );
}

/** Air linehaul: aircraft on a dashed great-circle arc above a horizon. */
function AirfreightScene() {
  return (
    <g>
      {/* Distant horizon and cloud banks. */}
      <ellipse cx="120" cy="300" rx="210" ry="54" fill="#d3dfec" />
      <ellipse cx="480" cy="316" rx="240" ry="60" fill="#c9d7e7" />

      <g fill="#ffffff" opacity=".75">
        <ellipse cx="96" cy="104" rx="52" ry="20" />
        <ellipse cx="136" cy="96" rx="38" ry="24" />
        <ellipse cx="520" cy="150" rx="60" ry="22" />
        <ellipse cx="560" cy="142" rx="40" ry="26" />
      </g>

      {/* Route arc, matching the tracking map's treatment. */}
      <path
        d="M56 262 Q 320 40 596 190"
        fill="none"
        stroke="#e9909a"
        strokeWidth="4"
        strokeDasharray="12 12"
        strokeLinecap="round"
      />
      <path
        d="M56 262 Q 320 40 596 190"
        fill="none"
        stroke="#d91f2e"
        strokeWidth="4.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="0.62 1"
      />

      {/* Origin and destination pins. */}
      <Pin x={56} y={262} colour="#d91f2e" />
      <Pin x={596} y={190} colour="#9aa3b2" />

      {/* Aircraft at the head of the travelled arc. */}
      <g transform="translate(352 108) rotate(14)">
        <circle r="30" fill="#d91f2e" opacity=".12" />
        <path
          d="M30 0 -9 -17 -3 -3 -21 -3 -27 -11 -32 -11 -27 0 -32 11 -27 11 -21 3 -3 3 -9 17Z"
          fill="#d91f2e"
        />
      </g>
    </g>
  );
}

/** Doorstep handover: two figures, a parcel changing hands. */
function HandoverScene() {
  return (
    <g>
      <rect y="252" width="640" height="108" fill="#e9d6d8" />

      {/* Doorway. */}
      <rect x="60" y="72" width="150" height="180" rx="8" fill="#f0dfe1" />
      <rect x="76" y="88" width="118" height="164" rx="6" fill="#e2cbce" />
      <circle cx="182" cy="176" r="5" fill="#c8a9ad" />

      {/* Recipient. */}
      <g fill="#b9959a">
        <circle cx="252" cy="126" r="26" />
        <path d="M252 158c-30 0-52 22-52 50v44h104v-44c0-28-22-50-52-50Z" />
      </g>

      {/* Parcel mid handover, the focal object. */}
      <g>
        <rect x="288" y="164" width="72" height="58" rx="4" fill="#e3b071" />
        <rect x="288" y="164" width="72" height="8" rx="3" fill="#d19a58" />
        <rect x="318" y="164" width="9" height="58" fill="#d19a58" opacity=".6" />
        <rect x="296" y="182" width="34" height="5" rx="2.5" fill="#d91f2e" opacity=".75" />
        <rect x="296" y="192" width="22" height="5" rx="2.5" fill="#d91f2e" opacity=".45" />
      </g>

      {/* Courier, in brand red uniform. */}
      <g>
        <circle cx="424" cy="122" r="27" fill="#c99298" />
        <path d="M424 100a27 27 0 0 1 27 22h-54a27 27 0 0 1 27-22Z" fill="#d91f2e" />
        <path d="M424 156c-33 0-58 24-58 54v42h116v-42c0-30-25-54-58-54Z" fill="#d91f2e" />
        <path d="M366 210c14-8 30-12 58-12s44 4 58 12" stroke="#b71825" strokeWidth="4" fill="none" />
      </g>

      {/* Second parcel on the ground. */}
      <g>
        <rect x="508" y="196" width="66" height="56" rx="4" fill="#d9a463" />
        <rect x="508" y="196" width="66" height="8" rx="3" fill="#c68f4d" />
        <rect x="537" y="196" width="8" height="56" fill="#c68f4d" opacity=".6" />
      </g>
    </g>
  );
}

/** Final mile: van moving through a city skyline. */
function CityDeliveryScene() {
  const buildings = [
    { x: 30, y: 96, w: 62, h: 156 },
    { x: 100, y: 138, w: 48, h: 114 },
    { x: 156, y: 68, w: 70, h: 184 },
    { x: 234, y: 122, w: 54, h: 130 },
    { x: 296, y: 88, w: 64, h: 164 },
    { x: 368, y: 146, w: 46, h: 106 },
    { x: 422, y: 104, w: 58, h: 148 },
    { x: 488, y: 132, w: 50, h: 120 },
    { x: 546, y: 78, w: 68, h: 174 },
  ];

  return (
    <g>
      {buildings.map((building, index) => (
        <g key={building.x}>
          <rect
            x={building.x}
            y={building.y}
            width={building.w}
            height={building.h}
            rx="3"
            fill={index % 2 === 0 ? "#cfdae8" : "#c3d1e2"}
          />
          {Array.from({ length: Math.floor(building.h / 26) }).map((_, row) =>
            Array.from({ length: Math.floor(building.w / 22) }).map((__, col) => (
              <rect
                key={`${row}-${col}`}
                x={building.x + 8 + col * 22}
                y={building.y + 14 + row * 26}
                width="9"
                height="12"
                rx="1.5"
                fill="#eaf0f7"
                opacity={(row + col + index) % 4 === 0 ? 0.95 : 0.55}
              />
            )),
          )}
        </g>
      ))}

      {/* Road. */}
      <rect y="252" width="640" height="108" fill="#b9c6d8" />
      <rect y="252" width="640" height="4" fill="#a5b5cb" />
      {[20, 120, 220, 320, 420, 520, 620].map((x) => (
        <rect key={x} x={x} y="308" width="52" height="6" rx="3" fill="#e4ecf5" opacity=".8" />
      ))}

      {/* Delivery van. */}
      <g transform="translate(180 196)">
        <rect x="0" y="0" width="150" height="76" rx="8" fill="#ffffff" />
        <rect x="0" y="0" width="150" height="76" rx="8" fill="none" stroke="#c2c9d4" strokeWidth="3" />
        <path d="M150 14h26l22 30h10a5 5 0 0 1 5 5v27h-63V14Z" fill="#d91f2e" />
        <path d="M158 22h16l14 20h-30V22Z" fill="#f7a3ab" />
        <rect x="16" y="24" width="60" height="6" rx="3" fill="#d91f2e" opacity=".8" />
        <rect x="16" y="38" width="38" height="6" rx="3" fill="#d91f2e" opacity=".4" />
        <circle cx="38" cy="76" r="17" fill="#232a34" />
        <circle cx="38" cy="76" r="7" fill="#9aa3b2" />
        <circle cx="178" cy="76" r="17" fill="#232a34" />
        <circle cx="178" cy="76" r="7" fill="#9aa3b2" />
      </g>

      {/* Destination pin ahead of the van. */}
      <Pin x={470} y={250} colour="#d91f2e" />

      {/* Motion streaks behind. */}
      <rect x="90" y="216" width="66" height="8" rx="4" fill="#d91f2e" opacity=".28" />
      <rect x="66" y="238" width="96" height="8" rx="4" fill="#d91f2e" opacity=".16" />
    </g>
  );
}

function Pin({ x, y, colour }: { x: number; y: number; colour: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="2" rx="17" ry="6" fill={colour} opacity=".18" />
      <path d="M0 2C0 2 -15 -14 -15 -24a15 15 0 0 1 30 0C15 -14 0 2 0 2Z" fill={colour} />
      <circle cy="-24" r="5.6" fill="#ffffff" />
    </g>
  );
}
