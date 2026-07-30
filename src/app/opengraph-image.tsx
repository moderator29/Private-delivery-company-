import { ImageResponse } from "next/og";

import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name} - ${BRAND.descriptor}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social sharing image, generated at build time rather than shipped as a static
 * asset so it stays in step with the brand constants.
 *
 * Uses only system fonts and flat colour: next/og runs in a constrained runtime
 * where a webfont fetch is an extra failure mode for something purely cosmetic.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand red rule along the top edge. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            background: "#d91f2e",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ width: 78, height: 13, borderRadius: 999, background: "#f7a3ab" }} />
            <div style={{ width: 118, height: 13, borderRadius: 999, background: "#d91f2e" }} />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#232a34" }}>Swift</span>
            <span style={{ color: "#d91f2e" }}>Track</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 700,
              color: "#14181f",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 940,
            }}
          >
            Deliveries handled privately, tracked end to end.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#5b6470" }}>
            {`${BRAND.descriptor} - ${BRAND.headquarters.city}, ${BRAND.headquarters.country}`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            color: "#6b7484",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              border: "2px solid #e2e5eb",
              color: "#232a34",
              fontWeight: 600,
            }}
          >
            STX9 8475 6532 US
          </div>
          <span>Every scan on the record</span>
        </div>
      </div>
    ),
    size,
  );
}
