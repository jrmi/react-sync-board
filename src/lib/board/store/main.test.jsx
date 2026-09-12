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

function SelectionProbe() {
  const [selection, select, unselect, reverse] = useMainStore((state) => [
    state.selection,
    state.select,
    state.unselect,
    state.reverse,
  ]);

  return (
    <>
      <output>{selection.join(",")}</output>
      <button onClick={() => select(["a", "b"])}>select</button>
      <button onClick={() => unselect(["a"])}>unselect</button>
      <button onClick={reverse}>reverse</button>
    </>
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

  it("supports selecting, unselecting, and reversing items", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(
        <MainStoreProvider>
          <SelectionProbe />
        </MainStoreProvider>
      );
    });

    act(() => container.querySelector("button").click());
    expect(container.querySelector("output").textContent).toBe("a,b");
    act(() => container.querySelectorAll("button")[1].click());
    expect(container.querySelector("output").textContent).toBe("b");
    act(() => container.querySelectorAll("button")[2].click());
    expect(container.querySelector("output").textContent).toBe("b");
    act(() => root.unmount());
  });
});
