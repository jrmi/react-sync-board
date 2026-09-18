import { normalizeGrid } from "./board/grid";
import { describe, expect, it } from "vitest";

import {
  distance,
  getLinkedItems,
  isPointInsideRect,
  rotateCoordinates,
  resolveGridConfig,
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
    expect(
      transformFrom(transformTo(point, boardState), boardState)[0],
    ).toBeCloseTo(point[0]);
    expect(
      transformFrom(transformTo(point, boardState), boardState)[1],
    ).toBeCloseTo(point[1]);
  });

  it("snaps item centers to a grid while preserving dimensions", () => {
    expect(
      snapToGrid(
        { x: 3, y: 7, width: 4, height: 4 },
        { type: "grid", size: 10 },
      ),
    ).toEqual({ x: 8, y: 8 });
  });

  it.each([
    ["no grid", null, null, null],
    [
      "board grid only",
      { type: "hexH", size: 10 },
      undefined,
      { type: "hexH", size: 10 },
    ],
    [
      "item grid only",
      null,
      { type: "grid", size: 5 },
      { type: "grid", size: 5 },
    ],
    [
      "item grid takes precedence",
      { type: "hexH", size: 10 },
      { type: "grid", size: 5 },
      { type: "grid", size: 5 },
    ],
  ])("resolves %s", (_name, boardGrid, itemGrid, expected) => {
    expect(resolveGridConfig(boardGrid, itemGrid)).toEqual(
      normalizeGrid(expected),
    );
  });

  it("uses the board grid when the item has no custom grid", () => {
    const item = { x: 3, y: 7, width: 4, height: 4 };
    const boardGrid = { type: "grid", size: 10 };

    expect(snapToGrid(item, resolveGridConfig(boardGrid, undefined))).toEqual({
      x: 8,
      y: 8,
    });
  });

  it.each([
    ["no grid", null, undefined, { x: 3, y: 7 }],
    ["board grid", { type: "grid", size: 10 }, undefined, { x: 8, y: 8 }],
    ["item grid", null, { type: "grid", size: 5 }, { x: 3, y: 8 }],
    [
      "item grid takes precedence",
      { type: "grid", size: 10 },
      { type: "grid", size: 5 },
      { x: 3, y: 8 },
    ],
  ])("snaps with %s", (_name, boardGrid, itemGrid, expectedPosition) => {
    const item = { x: 3, y: 7, width: 4, height: 4 };
    const grid = resolveGridConfig(boardGrid, itemGrid);

    expect(grid ? snapToGrid(item, grid) : item).toMatchObject(
      expectedPosition,
    );
  });

  it.each([
    ["hexH", { x: 6.660258075690654, y: 12 }],
    ["hexV", { x: 13, y: 22.98077422707196 }],
  ])("snaps to a %s grid", (type, expectedPosition) => {
    const position = snapToGrid(
      { x: 13, y: 17, width: 4, height: 6 },
      { type, size: 10 },
    );

    expect(position.x).toBeCloseTo(expectedPosition.x);
    expect(position.y).toBeCloseTo(expectedPosition.y);
  });

  it.each([
    ["hexH", { x: 6.660258075690654, y: 12 }],
    ["hexV", { x: 13, y: 22.98077422707196 }],
  ])(
    "gives an item %s grid precedence over the board grid",
    (type, expectedPosition) => {
      const item = { x: 13, y: 17, width: 4, height: 6 };
      const grid = resolveGridConfig(
        { type: "grid", size: 10 },
        { type, size: 10 },
      );
      const position = snapToGrid(item, grid);

      expect(position.x).toBeCloseTo(expectedPosition.x);
      expect(position.y).toBeCloseTo(expectedPosition.y);
    },
  );

  it.each([
    ["hexH", { x: 8, y: 22 }],
    ["hexV", { x: 8, y: 9.320516151381309 }],
  ])("applies offsets to a %s grid", (type, expectedPosition) => {
    const position = snapToGrid(
      { x: 13, y: 17, width: 4, height: 6 },
      { type, size: 10, offset: { x: 10, y: -5 } },
    );

    expect(position.x).toBeCloseTo(expectedPosition.x);
    expect(position.y).toBeCloseTo(expectedPosition.y);
  });

  it("applies grid offsets", () => {
    expect(
      snapToGrid(
        { x: 13, y: 17, width: 4, height: 6 },
        { type: "grid", size: 10, offset: { x: 10, y: -5 } },
      ),
    ).toEqual({ x: 18, y: 22 });
  });

  it.each([
    [
      "board offset",
      { type: "grid", size: 10, offset: { x: 10, y: -5 } },
      undefined,
      { x: 18, y: 22 },
    ],
    [
      "item offset",
      undefined,
      { type: "grid", size: 10, offset: { x: 3, y: 4 } },
      { x: 11, y: 21 },
    ],
    [
      "item offset takes precedence",
      { type: "grid", size: 10, offset: { x: 10, y: -5 } },
      { type: "grid", size: 10, offset: { x: 3, y: 4 } },
      { x: 11, y: 21 },
    ],
  ])("uses the correct %s", (_name, boardGrid, itemGrid, expectedPosition) => {
    const grid = resolveGridConfig(boardGrid, itemGrid);

    expect(snapToGrid({ x: 13, y: 17, width: 4, height: 6 }, grid)).toEqual(
      expectedPosition,
    );
  });

  it.each([
    ["disabled board grid", { type: "none", size: 10 }, undefined],
    [
      "disabled item grid",
      { type: "grid", size: 10 },
      { type: "none", size: 5 },
    ],
    [
      "invalid item grid",
      { type: "grid", size: 10 },
      { type: "invalid", size: 5 },
    ],
  ])("falls back correctly for %s", (_name, boardGrid, itemGrid) => {
    expect(resolveGridConfig(boardGrid, itemGrid)).toEqual(
      normalizeGrid(boardGrid),
    );
  });

  it("ignores a legacy item grid when resolving the board grid", () => {
    expect(
      resolveGridConfig(
        { type: "hexV", size: 10 },
        { size: 5, offset: { x: 2, y: 3 } },
      ),
    ).toEqual(normalizeGrid({ type: "hexV", size: 10 }));
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
