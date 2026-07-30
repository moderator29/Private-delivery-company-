/**
 * Geometry for the tracking route map.
 *
 * Origin and destination are projected onto a world equirectangular map using
 * their real coordinates, so a Dubai to Miami shipment visibly crosses half the
 * globe and a Dubai to Riyadh one does not. When coordinates are missing the
 * endpoints fall back to a neutral left-to-right layout rather than guessing.
 *
 * The marker position along the arc reflects how far the shipment has progressed
 * through its normal milestones. It is a summary of progress, not a position
 * report, and the component says so in its caption. There is no live GPS in this
 * product.
 */

import { WORLD_MAP_VIEWBOX } from "./world-map";

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface Point {
  x: number;
  y: number;
}

/** The projection surface. Matches the world map path's coordinate space. */
export const MAP_WIDTH = WORLD_MAP_VIEWBOX.width;
export const MAP_HEIGHT = WORLD_MAP_VIEWBOX.height;

/** A quarter of the world. Beyond this, a westward route is drawn eastbound. */
const EASTBOUND_WRAP_THRESHOLD = MAP_WIDTH * 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hasCoordinates(place: Coordinates): boolean {
  return (
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude)
  );
}

/**
 * Equirectangular projection onto the world map surface.
 * Longitude -180..180 maps to x 0..width, latitude 90..-90 maps to y 0..height.
 */
export function projectToMap(place: Coordinates): Point | null {
  if (!hasCoordinates(place)) return null;

  const latitude = clamp(place.latitude as number, -85, 85);
  const longitude = clamp(place.longitude as number, -180, 180);

  return {
    x: ((longitude + 180) / 360) * MAP_WIDTH,
    y: ((90 - latitude) / 180) * MAP_HEIGHT,
  };
}

/** Point on a quadratic bezier at t, where t runs 0 to 1. */
export function quadraticPointAt(from: Point, control: Point, to: Point, t: number): Point {
  const clamped = clamp(t, 0, 1);
  const inverse = 1 - clamped;
  return {
    x: inverse * inverse * from.x + 2 * inverse * clamped * control.x + clamped * clamped * to.x,
    y: inverse * inverse * from.y + 2 * inverse * clamped * control.y + clamped * clamped * to.y,
  };
}

/** Tangent angle in degrees at t, used to point the aircraft marker forward. */
export function quadraticAngleAt(from: Point, control: Point, to: Point, t: number): number {
  const clamped = clamp(t, 0, 1);
  const inverse = 1 - clamped;
  const dx = 2 * inverse * (control.x - from.x) + 2 * clamped * (to.x - control.x);
  const dy = 2 * inverse * (control.y - from.y) + 2 * clamped * (to.y - control.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export interface RouteGeometry {
  from: Point;
  to: Point;
  control: Point;
  /** SVG path command for the arc. */
  path: string;
  marker: Point;
  markerAngle: number;
  /** False when either endpoint had no coordinates and a fallback was used. */
  usesRealCoordinates: boolean;
  /**
   * The viewBox to render, cropped around the route with margin so a short hop
   * is not lost on a full world map.
   */
  viewBox: { x: number; y: number; width: number; height: number };
}

/**
 * Builds everything the route map needs to draw itself.
 *
 * The arc bows toward the top of the map by a fraction of the endpoint
 * separation, with a floor so nearby cities still read as an arc rather than a
 * flat line, and a ceiling so a half-globe route does not shoot off the top.
 */
export function buildRouteGeometry(
  origin: Coordinates,
  destination: Coordinates,
  progressFraction: number,
): RouteGeometry {
  const projectedOrigin = projectToMap(origin);
  const projectedDestination = projectToMap(destination);
  const usesRealCoordinates = projectedOrigin !== null && projectedDestination !== null;

  const from = projectedOrigin ?? { x: MAP_WIDTH * 0.2, y: MAP_HEIGHT * 0.45 };
  const to = { ...(projectedDestination ?? { x: MAP_WIDTH * 0.8, y: MAP_HEIGHT * 0.45 }) };

  // Long westward routes are drawn eastbound, so the journey reads left to
  // right across the frame.
  //
  // Dubai to Miami runs west, which would otherwise put the destination on the
  // left and the aircraft flying backwards. Adding one world width sends it east
  // across the Pacific instead: a real routing direction, and the backdrop is
  // tiled either side of the seam so the map stays continuous.
  //
  // The threshold matters. Without it, a short westward hop such as Dubai to
  // Riyadh would also wrap and be drawn as a trip around the entire globe. Only
  // routes spanning more than a quarter of the world are redirected.
  if (to.x < from.x && from.x - to.x > EASTBOUND_WRAP_THRESHOLD) {
    to.x += MAP_WIDTH;
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const lift = clamp(distance * 0.34, 52, 150);

  const control: Point = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 - lift,
  };

  return {
    from,
    to,
    control,
    path: `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${control.x.toFixed(2)} ${control.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`,
    marker: quadraticPointAt(from, control, to, progressFraction),
    markerAngle: quadraticAngleAt(from, control, to, progressFraction),
    usesRealCoordinates,
    viewBox: computeViewBox(from, to, control),
  };
}

/**
 * Crops the world map around the route.
 *
 * Wide horizontal margins keep the pin labels inside the frame, and the top
 * margin accounts for the arc rising above both endpoints. The result is
 * clamped to the map surface so the crop never exposes empty space beyond the
 * projection, and the aspect ratio is widened to match the panel so the map is
 * not vertically stretched.
 */
function computeViewBox(from: Point, to: Point, control: Point) {
  const minX = Math.min(from.x, to.x);
  const maxX = Math.max(from.x, to.x);
  const minY = Math.min(from.y, to.y, control.y);
  const maxY = Math.max(from.y, to.y);

  // Generous margins on purpose. Cropped tightly around two pins, the
  // simplified world silhouette reads as abstract shapes; with enough
  // surrounding landmass in frame it reads as a map.
  const marginX = Math.max(190, (maxX - minX) * 0.34);
  const marginY = Math.max(90, (maxY - minY) * 0.4);

  let x = minX - marginX;
  let y = minY - marginY;
  let width = maxX - minX + marginX * 2;
  let height = maxY - minY + marginY * 2;

  // Match the panel's aspect ratio so nothing is squashed.
  const targetRatio = 2.6;
  if (width / height < targetRatio) {
    const desiredWidth = height * targetRatio;
    x -= (desiredWidth - width) / 2;
    width = desiredWidth;
  } else {
    const desiredHeight = width / targetRatio;
    y -= (desiredHeight - height) / 2;
    height = desiredHeight;
  }

  // The horizontal crop is deliberately not clamped to one world width: an
  // eastbound route legitimately crosses the seam, and the backdrop is tiled to
  // cover it. Only the vertical crop is clamped, since the map does not repeat
  // in that direction.
  height = Math.min(height, MAP_HEIGHT);
  y = clamp(y, 0, MAP_HEIGHT - height);

  return { x, y, width, height };
}
