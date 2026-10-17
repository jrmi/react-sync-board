import { describe, expect, it } from "vitest";

import { storeEquality } from "./storeEquality";

describe("storeEquality", () => {
  it("compares array elements with Object.is", () => {
    expect(storeEquality([NaN, 0], [NaN, 0])).toBe(true);
    expect(storeEquality([-0], [0])).toBe(false);
    expect(storeEquality(["a"], ["a", "b"])).toBe(false);
  });

  it("preserves reference comparison for nested array values", () => {
    const nested = {};
    expect(storeEquality([nested], [nested])).toBe(true);
    expect(storeEquality([nested], [{}])).toBe(false);
  });
});
