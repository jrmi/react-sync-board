/** @vitest-environment jsdom */
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useMainStore, { createMainStore, MainStoreProvider } from "./main";

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

function SubscriptionProbe({ onRender }) {
  const [scale] = useMainStore((state) => [state.boardState.scale]);
  onRender();
  return <output>{scale}</output>;
}

function ActionsProbe({ onReady }) {
  const [updateBoardState, updateConfiguration, setSelection, setSelectionBox] =
    useMainStore((state) => [
      state.updateBoardState,
      state.updateConfiguration,
      state.setSelection,
      state.setSelectionBox,
    ]);
  React.useEffect(
    () => {
      onReady({
        updateBoardState,
        updateConfiguration,
        setSelection,
        setSelectionBox,
      });
    },
    [
      onReady,
      updateBoardState,
      updateConfiguration,
      setSelection,
      setSelectionBox,
    ]
  );
  return null;
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

  it("does not notify selectors for unchanged actions", () => {
    const onRender = vi.fn();
    let actions;
    render(
      <MainStoreProvider>
        <ActionsProbe onReady={(value) => (actions = value)} />
        <SubscriptionProbe onRender={onRender} />
      </MainStoreProvider>
    );

    const initialRenders = onRender.mock.calls.length;
    act(() => {
      actions.updateBoardState({ scale: 1, zooming: false });
      actions.updateConfiguration({ boardSize: 100000 });
      actions.setSelection([]);
      actions.setSelectionBox(null);
    });

    expect(onRender).toHaveBeenCalledTimes(initialRenders);

    act(() => actions.updateBoardState({ scale: 2 }));
    expect(onRender).toHaveBeenCalledTimes(initialRenders + 1);
  });

  it("preserves root identity and subscriptions for unchanged actions", () => {
    const store = createMainStore();
    const initialState = store.getState();
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().updateBoardState({ scale: 1, zooming: false });
    store
      .getState()
      .updateConfiguration({ boardSize: initialState.config.boardSize });
    store.getState().setSelection([]);
    store.getState().select([]);
    store.getState().unselect(["missing"]);
    store.getState().clear();
    store.getState().reverse();
    store.getState().setSelectionBox(null);

    expect(store.getState()).toBe(initialState);
    expect(listener).not.toHaveBeenCalled();

    store.getState().updateBoardState({ scale: 2 });
    expect(store.getState()).not.toBe(initialState);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
