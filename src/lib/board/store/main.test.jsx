/** @vitest-environment jsdom */
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import useMainStore, { MainStoreProvider } from "./main";

function Probe() {
  const [boardState, updateBoardState] = useMainStore((state) => [
    state.boardState,
    state.updateBoardState,
  ]);

  return (
    <button onClick={() => updateBoardState({ scale: 2 })}>
      {boardState.scale}
    </button>
  );
}

describe("MainStoreProvider", () => {
  it("keeps array selectors stable and responds to updates", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(
        <MainStoreProvider>
          <Probe />
        </MainStoreProvider>
      );
    });

    expect(container.textContent).toBe("1");

    act(() => {
      container.querySelector("button").click();
    });

    expect(container.textContent).toBe("2");
    act(() => root.unmount());
  });
});
