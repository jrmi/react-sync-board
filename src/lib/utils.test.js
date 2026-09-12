import { describe, expect, it } from "vitest";

import {
  distance,
  getLinkedItems,
  isPointInsideRect,
  rotateCoordinates,
  snapToGrid,
  transformFrom,
  transformTo,
} from "./utils";

describe("geometry utilities", () => {
  it("calculates distances and rotations", () => {
    expect(distance([0, 0], [3, 4])).toBe(5);
    expect(rotateCoordinates(1, 0, 90)[0]).toBeCloseTo(0);
    expect(rotateCoordinates(1, 0, 90)[1]).toBeCloseTo(1);
  });

  it("round-trips board transforms", () => {
    const boardState = { scale: 2, rotate: 30, translateX: 10, translateY: -4 };
    const point = [7, 12];
    expect(transformFrom(transformTo(point, boardState), boardState)[0]).toBeCloseTo(point[0]);
    expect(transformFrom(transformTo(point, boardState), boardState)[1]).toBeCloseTo(point[1]);
  });

  it("snaps item centers to a grid while preserving dimensions", () => {
    expect(snapToGrid({ x: 3, y: 7, width: 4, height: 4 }, { size: 10 })).toEqual({ x: 8, y: 8 });
  });

  it("checks strict rectangle boundaries", () => {
    const rect = { left: 10, top: 20, width: 30, height: 40 };
    expect(isPointInsideRect({ x: 20, y: 30 }, rect)).toBe(true);
    expect(isPointInsideRect({ x: 10, y: 30 }, rect)).toBe(false);
  });

  it("returns linked items in display order and handles cycles", () => {
    const items = {
      a: { linkedItems: ["b"] },
      b: { linkedItems: ["a", "missing"] },
      c: { linkedItems: [] },
    };
    expect(getLinkedItems(items, ["c", "b", "a"], ["a"])).toEqual(["b", "a"]);
  });
});
