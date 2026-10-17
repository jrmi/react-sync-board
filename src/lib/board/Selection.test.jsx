/** @vitest-environment jsdom */
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Selection from "./Selection";
import useMainStore, { MainStoreProvider } from "./store/main";

const { measure, synced } = vi.hoisted(() => ({
  measure: vi.fn(),
  synced: { items: {} },
}));
vi.mock("@/utils", () => ({ getItemsBoundingBox: measure }));
vi.mock("@/board/store/synced", () => ({
  useSyncedStore: (selector) => selector(synced),
}));

let state;
function Probe() {
  const current = useMainStore((value) => value);
  React.useLayoutEffect(() => {
    state = current;
  }, [current]);
  return <Selection />;
}
function setup() {
  vi.useFakeTimers();
  measure.mockReturnValue({ left: 110, top: 220, width: 40, height: 60 });
  render(
    <MainStoreProvider>
      <Probe />
    </MainStoreProvider>
  );
  act(() =>
    state.updateConfiguration({ boardWrapperRect: { left: 10, top: 20 } })
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("selection camera tracking", () => {
  it("keeps an empty selection null during camera changes", () => {
    setup();
    act(() => state.updateBoardState({ scale: 2, translateX: 50, rotate: 30 }));
    expect(state.selectionBox).toBeNull();
    expect(measure).not.toHaveBeenCalled();
  });

  it.each([["a"], ["a", "b"]])(
    "projects %j without measuring on zoom or pan",
    (...ids) => {
      setup();
      act(() => state.setSelection(ids));
      expect(measure).toHaveBeenCalledTimes(1);
      act(() =>
        state.updateBoardState({ scale: 2, translateX: 30, translateY: -10 })
      );
      expect(state.selectionBox).toEqual({
        left: 230,
        top: 390,
        width: 80,
        height: 120,
      });
      expect(measure).toHaveBeenCalledTimes(1);
      act(() => state.updateBoardState({ translateX: 40 }));
      expect(state.selectionBox.left).toBe(240);
      expect(measure).toHaveBeenCalledTimes(1);

      measure.mockReturnValue({ left: 20, top: 40, width: 120, height: 80 });
      act(() => state.updateBoardState({ rotate: 90 }));
      expect(measure).toHaveBeenCalledTimes(2);
      expect(state.selectionBox).toEqual({
        left: 10,
        top: 20,
        width: 120,
        height: 80,
      });
      act(() => vi.advanceTimersByTime(350));
      expect(measure).toHaveBeenCalledTimes(3);
      act(() => state.clear());
      expect(state.selectionBox).toBeNull();
    }
  );
});
