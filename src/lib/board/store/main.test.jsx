/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

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
  afterEach(() => cleanup());

  it("keeps array selectors stable and responds to updates", () => {
    const { container } = render(
      <MainStoreProvider>
        <Probe />
      </MainStoreProvider>
    );

    expect(container.textContent).toBe("1");

    fireEvent.click(container.querySelector("button"));

    expect(container.textContent).toBe("2");
  });

  it("supports selecting, unselecting, and reversing items", () => {
    const { container } = render(
      <MainStoreProvider>
        <SelectionProbe />
      </MainStoreProvider>
    );

    fireEvent.click(container.querySelector("button"));
    expect(container.querySelector("output").textContent).toBe("a,b");
    fireEvent.click(container.querySelectorAll("button")[1]);
    expect(container.querySelector("output").textContent).toBe("b");
    fireEvent.click(container.querySelectorAll("button")[2]);
    expect(container.querySelector("output").textContent).toBe("b");
  });
});
