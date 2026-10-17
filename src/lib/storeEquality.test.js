import { describe, expect, it } from "vitest";

import { storeEquality } from "./storeEquality";

describe("storeEquality", () => {
  it("compares array elements with Object.is", () => {
    expect(storeEquality([NaN, 0], [NaN, 0])).toBe(true);
    expect(storeEquality([-0], [0])).toBe(false);
    expect(storeEquality(["a"], ["a", "b"])).toBe(false);
    expect(storeEquality(Array(1), ["a"])).toBe(false);
    expect(storeEquality(Array(1), [undefined])).toBe(true);
  });

  it("keeps Zustand shallow semantics for non-array selectors", () => {
    const nested = {};
    expect(storeEquality({ nested }, { nested })).toBe(true);
    expect(storeEquality({ nested }, { nested: {} })).toBe(false);
    expect(storeEquality(new Set([1, 2]), new Set([1, 2]))).toBe(true);
  });

  it("preserves reference comparison for nested array values", () => {
    const nested = {};
    expect(storeEquality([nested], [nested])).toBe(true);
    expect(storeEquality([nested], [{}])).toBe(false);
  });
});
