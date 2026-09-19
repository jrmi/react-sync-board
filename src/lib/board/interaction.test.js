import { describe, expect, it } from "vitest";

import { getDefaultNavigationMode } from "./interaction";

describe("getDefaultNavigationMode", () => {
  it("uses trackpad navigation for the macOS platform heuristic", () => {
    expect(getDefaultNavigationMode("MacIntel")).toBe("trackpad");
    expect(getDefaultNavigationMode("Mac OS X")).toBe("trackpad");
  });

  it("uses wheel navigation on other platforms", () => {
    expect(getDefaultNavigationMode("Linux x86_64")).toBe("wheel");
    expect(getDefaultNavigationMode("Win32")).toBe("wheel");
  });
});
