import { describe, expect, it } from "vitest";
import {
  gridGeometry,
  normalizeGrid,
  resolveGridConfig,
  snapToGrid,
} from "./grid";

describe("canonical grid geometry", () => {
  it("defaults each partial/string offset axis independently", () => {
    expect(
      snapToGrid(
        { x: 13, y: 17, width: 4, height: 6 },
        { type: "grid", size: "10", offset: { x: "3" } },
      ),
    ).toEqual({ x: 11, y: 17 });
    expect(
      normalizeGrid({ type: "grid", size: Infinity, offset: { y: "bad" } }),
    ).toMatchObject({ size: 1, offset: { x: 0, y: 0 } });
  });
  it.each([0, -1, NaN, Infinity, "invalid"])(
    "uses a positive finite default for size %s",
    (size) => {
      expect(normalizeGrid({ type: "grid", size }).size).toBe(1);
    },
  );
  it("does not activate a grid without a canonical active type", () => {
    expect(resolveGridConfig({ size: 5 }, { type: "none" })).toBeNull();
    expect(
      resolveGridConfig({ type: "none" }, { type: "grid", size: 2 }).size,
    ).toBe(2);
  });
  it.each(["grid", "hexH", "hexV"])(
    "aligns negative and fractional %s centers with overlay geometry",
    (type) => {
      const grid = normalizeGrid({
        type,
        size: 7.25,
        offset: { x: "-3.5", y: "2.25" },
      });
      const geometry = gridGeometry(grid);
      for (const [cx, cy] of geometry.centers) {
        const center = {
          x: cx - 4 * geometry.width + grid.offset.x,
          y: cy - 3 * geometry.height + grid.offset.y,
        };
        const position = {
          x: center.x - 2.25,
          y: center.y - 3.75,
          width: 4.5,
          height: 7.5,
        };
        const snapped = snapToGrid(position, grid);
        expect(snapped.x).toBeCloseTo(position.x, 10);
        expect(snapped.y).toBeCloseTo(position.y, 10);
        expect(
          snapToGrid(
            { ...position, x: position.x + 0.1, y: position.y - 0.1 },
            grid,
          ).x,
        ).toBeCloseTo(position.x, 10);
      }
    },
  );
  it("does not add offsets when snapping is disabled or return overflowed coordinates", () => {
    const position = { x: 4, y: 5, width: 6, height: 7 };
    expect(snapToGrid(position, { type: "none", offset: { x: 8 } })).toEqual({
      x: 4,
      y: 5,
    });
    expect(
      snapToGrid(position, { type: "grid", size: Number.MIN_VALUE }),
    ).toEqual({ x: 4, y: 5 });
  });
});
