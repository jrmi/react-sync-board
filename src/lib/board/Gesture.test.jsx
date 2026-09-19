/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Gesture from "./Gesture";

const renderGesture = (props = {}) => {
  const result = render(
    <Gesture mainAction="pan" {...props}>
      <div data-testid="surface" />
    </Gesture>
  );
  return result.getByTestId("surface");
};

const pointer = (type, target, pointerId, clientX, clientY, extra = {}) =>
  fireEvent[type](target, {
    pointerId,
    pointerType: "touch",
    clientX,
    clientY,
    button: 0,
    buttons: 1,
    ...extra,
  });

describe("Gesture touch navigation", () => {
  afterEach(() => cleanup());

  it("defaults to pan for a mouse and selection drag for touch or trackpad", async () => {
    const mousePan = vi.fn();
    const mouseSurface = renderGesture({ mainAction: "auto", onPan: mousePan });
    pointer("pointerDown", mouseSurface, 1, 0, 0, { pointerType: "mouse" });
    pointer("pointerMove", mouseSurface, 1, 10, 0, { pointerType: "mouse" });
    await waitFor(() => expect(mousePan).toHaveBeenCalled());

    cleanup();
    const touchDrag = vi.fn();
    const touchSurface = renderGesture({
      mainAction: "auto",
      onDrag: touchDrag,
    });
    pointer("pointerDown", touchSurface, 1, 0, 0);
    pointer("pointerMove", touchSurface, 1, 8, 0);
    await waitFor(() => expect(touchDrag).toHaveBeenCalled());

    cleanup();
    const trackpadDrag = vi.fn();
    const trackpadSurface = renderGesture({
      mainAction: "auto",
      navigationMode: "trackpad",
      onDrag: trackpadDrag,
    });
    pointer("pointerDown", trackpadSurface, 1, 0, 0, { pointerType: "mouse" });
    pointer("pointerMove", trackpadSurface, 1, 10, 0, { pointerType: "mouse" });
    await waitFor(() => expect(trackpadDrag).toHaveBeenCalled());
  });

  it("recognizes one-finger pinch movement from the distance change", async () => {
    const onPan = vi.fn();
    const onZoom = vi.fn();
    const surface = renderGesture({ onPan, onZoom });
    pointer("pointerDown", surface, 1, 0, 0);
    pointer("pointerDown", surface, 2, 20, 0);
    pointer("pointerMove", surface, 1, 20, 0);

    await waitFor(() => expect(onZoom).toHaveBeenCalled());
    expect(onPan).not.toHaveBeenCalled();
  });

  it("locks a two-finger pan and suppresses incidental zoom", async () => {
    const onPan = vi.fn();
    const onZoom = vi.fn();
    const surface = renderGesture({ onPan, onZoom });
    pointer("pointerDown", surface, 1, 0, 0);
    pointer("pointerDown", surface, 2, 20, 0);
    // The browser sends one move per finger; together these translate the
    // pair by 10px without changing its distance.
    pointer("pointerMove", surface, 1, 10, 0);
    pointer("pointerMove", surface, 2, 30, 0);
    await waitFor(() => expect(onPan).toHaveBeenCalled());
    expect(onPan.mock.calls[0][0]).toMatchObject({ deltaX: 10, deltaY: 0 });
    expect(onZoom).not.toHaveBeenCalled();

    pointer("pointerMove", surface, 1, 20, 0);
    pointer("pointerMove", surface, 2, 40, 0);
    await waitFor(() => expect(onPan).toHaveBeenCalledTimes(2));
    expect(onZoom).not.toHaveBeenCalled();
  });

  it("switches to the other gesture when it becomes significantly larger", async () => {
    const onPan = vi.fn();
    const onZoom = vi.fn();
    const surface = renderGesture({ onPan, onZoom });
    pointer("pointerDown", surface, 1, 0, 0);
    pointer("pointerDown", surface, 2, 20, 0);
    pointer("pointerMove", surface, 1, 10, 0);
    pointer("pointerMove", surface, 2, 30, 0);
    await waitFor(() => expect(onPan).toHaveBeenCalledTimes(1));

    // Pinch strongly without translating the midpoint: switch to zoom.
    pointer("pointerMove", surface, 1, -10, 0);
    pointer("pointerMove", surface, 2, 50, 0);
    await waitFor(() => expect(onZoom).toHaveBeenCalledTimes(1));

    // Resume a translation with a stable distance: switch back to pan.
    pointer("pointerMove", surface, 1, 0, 0);
    pointer("pointerMove", surface, 2, 60, 0);
    await waitFor(() => expect(onPan).toHaveBeenCalledTimes(2));
  });

  it("uses the current midpoint as the pinch zoom anchor", async () => {
    const onPan = vi.fn();
    const onZoom = vi.fn();
    const surface = renderGesture({ onPan, onZoom });
    pointer("pointerDown", surface, 1, 0, 0);
    pointer("pointerDown", surface, 2, 20, 0);
    pointer("pointerMove", surface, 2, 30, 0);

    await waitFor(() => expect(onZoom).toHaveBeenCalled());
    expect(onZoom.mock.calls[0][0]).toMatchObject({
      clientX: 15,
      clientY: 0,
      // Increasing finger distance produces a negative scale, which PanZoom
      // turns into a factor greater than one (zoom in).
      scale: -30,
    });
  });

  it("resets references when returning from two fingers to one", async () => {
    const onPan = vi.fn();
    const surface = renderGesture({ onPan });
    pointer("pointerDown", surface, 1, 0, 0);
    pointer("pointerMove", surface, 1, 10, 0);
    pointer("pointerDown", surface, 2, 30, 0);
    pointer("pointerUp", surface, 2, 30, 0);
    pointer("pointerMove", surface, 1, 15, 0);

    await waitFor(() => expect(onPan).toHaveBeenCalledTimes(2));
    expect(onPan.mock.calls[1][0]).toMatchObject({ deltaX: 5, deltaY: 0 });
  });

  it("ignores a third finger without changing the active pair", async () => {
    const onPan = vi.fn();
    const surface = renderGesture({ onPan });
    pointer("pointerDown", surface, 1, 0, 0);
    pointer("pointerDown", surface, 2, 20, 0);
    pointer("pointerDown", surface, 3, 100, 0);
    pointer("pointerMove", surface, 3, 200, 0);
    pointer("pointerMove", surface, 1, 10, 0);
    pointer("pointerMove", surface, 2, 30, 0);

    await waitFor(() => expect(onPan).toHaveBeenCalledTimes(1));
    expect(onPan.mock.calls[0][0]).toMatchObject({ deltaX: 10, deltaY: 0 });
  });

  it("cleans up cancelled pointers", async () => {
    const onPan = vi.fn();
    const surface = renderGesture({ onPan });
    pointer("pointerDown", surface, 1, 0, 0);
    pointer("pointerDown", surface, 2, 20, 0);
    pointer("pointerCancel", surface, 1, 0, 0);
    pointer("pointerUp", surface, 2, 20, 0);
    pointer("pointerDown", surface, 3, 0, 0);
    pointer("pointerMove", surface, 3, 8, 0);

    await waitFor(() => expect(onPan).toHaveBeenCalledTimes(1));
    expect(onPan.mock.calls[0][0]).toMatchObject({ deltaX: 8, deltaY: 0 });
  });
});
