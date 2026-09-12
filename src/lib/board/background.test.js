import { describe, expect, it } from "vitest";
import { transformFrom } from "@/utils";
import { repeatOffset, splitCSS, visibleTiles } from "./background";

describe("virtual background tiles", () => {
  it("uses an explicit world-space tile size at any zoom, and defaults invalid sizes to automatic", () => {
    for (const scale of [0.15, 1, 5]) {
      const camera = { translateX: 1000, translateY: -1000, scale, rotate: 45 };
      expect(visibleTiles(1000, 700, camera, 750).size).toBe(750);
      for (const invalid of [0, -1, NaN, Infinity]) {
        expect(visibleTiles(1000, 700, camera, invalid).size).toBe(
          visibleTiles(1000, 700, camera).size
        );
      }
    }
  });
  it("covers all viewport corners at distant positions, scales and rotations with bounded DOM size", () => {
    for (const scale of [0.15, 1, 5]) {
      for (const rotate of [0, 45, 90, 135, 270]) {
        for (const sign of [-1, 1]) {
          const camera = {
            translateX: sign * 1e9,
            translateY: -sign * 1e9,
            scale,
            rotate,
          };
          const grid = visibleTiles(1364, 632, camera);
          expect(grid.tiles.length).toBeLessThan(150);
          for (const corner of [
            [0, 0],
            [1364, 0],
            [0, 632],
            [1364, 632],
          ]) {
            const [x, y] = transformFrom(corner, camera);
            expect(
              grid.tiles.some(
                (tile) =>
                  x >= tile.left &&
                  x <= tile.left + grid.size &&
                  y >= tile.top &&
                  y <= tile.top + grid.size
              )
            ).toBe(true);
          }
        }
      }
    }
  });

  it("retains shared tiles and removes offscreen ones after panning", () => {
    const camera = { translateX: 0, translateY: 0, scale: 1, rotate: 0 };
    const before = visibleTiles(1364, 632, camera).tiles.map((t) => t.key);
    const after = visibleTiles(1364, 632, {
      ...camera,
      translateX: 512,
    }).tiles.map((t) => t.key);
    expect(after.some((key) => before.includes(key))).toBe(true);
    expect(before.some((key) => !after.includes(key))).toBe(true);
    expect(after.some((key) => !before.includes(key))).toBe(true);
  });

  it("keeps patterns continuous across tile edges even when their periods do not divide tile size", () => {
    for (const left of [-1e9, -512, 0, 512, 1e9]) {
      const offset = repeatOffset(-2, left, 37);
      const nextOffset = repeatOffset(-2, left + 512, 37);
      expect((((offset - 512) % 37) + 37) % 37).toBe(nextOffset);
    }
    expect(
      splitCSS('url("data:image/svg+xml,a,b"), linear-gradient(red, blue)')
    ).toHaveLength(2);
  });
});
