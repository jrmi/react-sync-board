/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MainStoreProvider } from "./store/main";
import useMainStore from "./store/main";
import useBoardState from "./useBoardState";

afterEach(cleanup);

it("keeps flag subscriptions stable while the camera changes", () => {
  const render = vi.fn();
  const { result } = renderHook(
    () => {
      const flags = useBoardState((state) => ({
        movingItems: state.movingItems,
      }));
      const update = useMainStore((state) => state.updateBoardState);
      render();
      return { flags, update };
    },
    { wrapper: MainStoreProvider }
  );
  const initial = result.current.flags;
  const renders = render.mock.calls.length;
  act(() => result.current.update({ scale: 2, translateX: 100, rotate: 30 }));
  expect(render).toHaveBeenCalledTimes(renders);
  expect(result.current.flags).toBe(initial);
  act(() => result.current.update({ movingItems: true }));
  expect(result.current.flags.movingItems).toBe(true);
  expect(render).toHaveBeenCalledTimes(renders + 1);
});

it("preserves the full-state default", () => {
  const { result } = renderHook(() => useBoardState(), {
    wrapper: MainStoreProvider,
  });
  expect(result.current.scale).toBe(1);
  expect(result.current.movingItems).toBe(false);
});
