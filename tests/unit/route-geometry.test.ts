import { describe, expect, it } from "vitest";

import {
  MAP_HEIGHT,
  MAP_WIDTH,
  buildRouteGeometry,
  hasCoordinates,
  projectToMap,
  quadraticAngleAt,
  quadraticPointAt,
  type Point,
} from "@/lib/tracking/route-geometry";

const DUBAI = { latitude: 25.2048, longitude: 55.2708 };
const MIAMI = { latitude: 25.7617, longitude: -80.1918 };
const RIYADH = { latitude: 24.7136, longitude: 46.6753 };
const NOWHERE = { latitude: null, longitude: null };

describe("hasCoordinates", () => {
  it("requires both a latitude and a longitude", () => {
    expect(hasCoordinates(DUBAI)).toBe(true);
    expect(hasCoordinates({ latitude: 25.2048, longitude: null })).toBe(false);
    expect(hasCoordinates({ latitude: null, longitude: 55.2708 })).toBe(false);
    expect(hasCoordinates(NOWHERE)).toBe(false);
  });

  it("treats zero as a real coordinate", () => {
    // The Gulf of Guinea is a legitimate place; 0 must not read as missing.
    expect(hasCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
  });

  it("rejects a non-finite coordinate", () => {
    expect(hasCoordinates({ latitude: Number.NaN, longitude: 55.2708 })).toBe(false);
    expect(hasCoordinates({ latitude: 25.2, longitude: Number.POSITIVE_INFINITY })).toBe(false);
  });
});

describe("projectToMap", () => {
  it("places Dubai on the right half of the map", () => {
    const point = projectToMap(DUBAI)!;
    expect(point.x).toBeCloseTo(653.5, 1);
    expect(point.y).toBeCloseTo(180, 1);
    expect(point.x).toBeGreaterThan(MAP_WIDTH / 2);
  });

  it("places Miami on the left half of the map", () => {
    const point = projectToMap(MIAMI)!;
    expect(point.x).toBeCloseTo(277.2, 1);
    expect(point.x).toBeLessThan(MAP_WIDTH / 2);
    // Miami sits slightly north of Dubai, so it must sit slightly higher.
    expect(point.y).toBeLessThan(projectToMap(DUBAI)!.y);
  });

  it("anchors the projection at the map corners", () => {
    expect(projectToMap({ latitude: 0, longitude: -180 })).toEqual({ x: 0, y: MAP_HEIGHT / 2 });
    expect(projectToMap({ latitude: 0, longitude: 180 })).toEqual({
      x: MAP_WIDTH,
      y: MAP_HEIGHT / 2,
    });
    expect(projectToMap({ latitude: 0, longitude: 0 })).toEqual({
      x: MAP_WIDTH / 2,
      y: MAP_HEIGHT / 2,
    });
  });

  it("clamps the poles so a point never falls off the surface", () => {
    // Latitude is clamped to 85 degrees, matching the drawn landmasses.
    const north = projectToMap({ latitude: 89, longitude: 0 })!;
    const south = projectToMap({ latitude: -89, longitude: 0 })!;
    expect(north.y).toBeGreaterThanOrEqual(0);
    expect(south.y).toBeLessThanOrEqual(MAP_HEIGHT);
    expect(north.y).toBeCloseTo(((90 - 85) / 180) * MAP_HEIGHT, 5);
  });

  it("returns null when a coordinate is missing", () => {
    expect(projectToMap(NOWHERE)).toBeNull();
    expect(projectToMap({ latitude: 25.2, longitude: null })).toBeNull();
  });
});

describe("quadraticPointAt", () => {
  const from: Point = { x: 100, y: 400 };
  const control: Point = { x: 500, y: 100 };
  const to: Point = { x: 900, y: 300 };

  it("returns the start point at t = 0 and the end point at t = 1", () => {
    expect(quadraticPointAt(from, control, to, 0)).toEqual(from);
    expect(quadraticPointAt(from, control, to, 1)).toEqual(to);
  });

  it("clamps t outside 0 to 1 rather than extrapolating off the curve", () => {
    expect(quadraticPointAt(from, control, to, -3)).toEqual(from);
    expect(quadraticPointAt(from, control, to, 2)).toEqual(to);
  });

  it("bows toward the control point at the midpoint", () => {
    const mid = quadraticPointAt(from, control, to, 0.5);
    expect(mid.x).toBeCloseTo(500);
    // Straight-line midpoint would be y = 350; the arc lifts it upward.
    expect(mid.y).toBeCloseTo(225);
    expect(mid.y).toBeLessThan(350);
  });
});

describe("quadraticAngleAt", () => {
  it("points along the curve and clamps t the same way", () => {
    const from: Point = { x: 0, y: 0 };
    const control: Point = { x: 50, y: 0 };
    const to: Point = { x: 100, y: 0 };
    expect(quadraticAngleAt(from, control, to, 0)).toBeCloseTo(0);
    expect(quadraticAngleAt(from, control, to, 5)).toBeCloseTo(0);
  });
});

describe("buildRouteGeometry", () => {
  it("uses real coordinates when both endpoints have them", () => {
    const geometry = buildRouteGeometry(DUBAI, MIAMI, 0.4);
    expect(geometry.usesRealCoordinates).toBe(true);
    expect(geometry.from).toEqual(projectToMap(DUBAI));
    expect(geometry.to).toEqual(projectToMap(MIAMI));
  });

  it("falls back to a neutral left-to-right layout when coordinates are missing", () => {
    const geometry = buildRouteGeometry(DUBAI, NOWHERE, 0.4);
    expect(geometry.usesRealCoordinates).toBe(false);
    expect(geometry.from).toEqual(projectToMap(DUBAI));
    expect(geometry.to).toEqual({ x: MAP_WIDTH * 0.8, y: MAP_HEIGHT * 0.45 });

    const neither = buildRouteGeometry(NOWHERE, NOWHERE, 0.4);
    expect(neither.usesRealCoordinates).toBe(false);
    expect(neither.from).toEqual({ x: MAP_WIDTH * 0.2, y: MAP_HEIGHT * 0.45 });
    expect(neither.to).toEqual({ x: MAP_WIDTH * 0.8, y: MAP_HEIGHT * 0.45 });
  });

  it("emits an SVG quadratic path between the two endpoints", () => {
    const geometry = buildRouteGeometry(DUBAI, MIAMI, 0.4);
    expect(geometry.path).toMatch(/^M [\d.-]+ [\d.-]+ Q [\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+$/);
  });

  it("puts the marker on the endpoints at the extremes of progress", () => {
    const start = buildRouteGeometry(DUBAI, MIAMI, 0);
    const end = buildRouteGeometry(DUBAI, MIAMI, 1);
    expect(start.marker).toEqual(start.from);
    expect(end.marker).toEqual(end.to);
  });

  it("lifts the arc above both endpoints so a short hop still reads as a route", () => {
    const short = buildRouteGeometry(DUBAI, RIYADH, 0.4);
    expect(short.control.y).toBeLessThan(Math.min(short.from.y, short.to.y));
  });

  it("keeps the crop inside the map surface for a short hop", () => {
    const { viewBox } = buildRouteGeometry(DUBAI, RIYADH, 0.4);
    expect(viewBox.x).toBeGreaterThanOrEqual(0);
    expect(viewBox.y).toBeGreaterThanOrEqual(0);
    expect(viewBox.x + viewBox.width).toBeLessThanOrEqual(MAP_WIDTH);
    expect(viewBox.y + viewBox.height).toBeLessThanOrEqual(MAP_HEIGHT);
    expect(viewBox.width).toBeGreaterThan(0);
    expect(viewBox.height).toBeGreaterThan(0);
  });

  it("keeps the crop inside the map surface for a half-globe route", () => {
    const { viewBox } = buildRouteGeometry(DUBAI, MIAMI, 0.4);
    expect(viewBox.x).toBeGreaterThanOrEqual(0);
    expect(viewBox.y).toBeGreaterThanOrEqual(0);
    expect(viewBox.x + viewBox.width).toBeLessThanOrEqual(MAP_WIDTH);
    expect(viewBox.y + viewBox.height).toBeLessThanOrEqual(MAP_HEIGHT);
  });

  it("crops tighter for a short hop than for a half-globe route", () => {
    const short = buildRouteGeometry(DUBAI, RIYADH, 0.4);
    const long = buildRouteGeometry(DUBAI, MIAMI, 0.4);
    expect(short.viewBox.width).toBeLessThan(long.viewBox.width);
  });

  it("keeps the crop inside the map for every pair of extreme endpoints", () => {
    const corners = [
      { latitude: 85, longitude: -180 },
      { latitude: -85, longitude: 180 },
      { latitude: 0, longitude: 0 },
      { latitude: 85, longitude: 180 },
      { latitude: -85, longitude: -180 },
    ];

    for (const origin of corners) {
      for (const destination of corners) {
        const { viewBox } = buildRouteGeometry(origin, destination, 0.5);
        expect(viewBox.x).toBeGreaterThanOrEqual(0);
        expect(viewBox.y).toBeGreaterThanOrEqual(0);
        expect(viewBox.x + viewBox.width).toBeLessThanOrEqual(MAP_WIDTH + 1e-9);
        expect(viewBox.y + viewBox.height).toBeLessThanOrEqual(MAP_HEIGHT + 1e-9);
      }
    }
  });
});
