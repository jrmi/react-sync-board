import React from "react";

// From https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
const getScrollLineHeight = () => {
  const iframe = document.createElement("iframe");
  iframe.src = "#";
  document.body.appendChild(iframe);
  const idoc = iframe.contentWindow.document;
  idoc.open();
  idoc.write("<!DOCTYPE html><html><body><span>a</span></body></html>");
  idoc.close();
  const lineHeight = idoc.body.firstElementChild.offsetHeight;
  document.body.removeChild(iframe);
  return lineHeight;
};

const LINE_HEIGHT = getScrollLineHeight();
const PAGE_HEIGHT = 800;
const TOUCH_DRAG_THRESHOLD = 5;
const GESTURE_SWITCH_RATIO = 1.5;
const empty = () => {};
const getMainAction = (mainAction, pointerType, navigationMode) => {
  if (mainAction !== "auto") return mainAction;
  return pointerType === "touch" || navigationMode === "trackpad"
    ? "drag"
    : "pan";
};
const distance = ([x1, y1], [x2, y2]) => Math.hypot(x1 - x2, y1 - y2);
const centerOf = (first, second) => ({
  clientX: (first.clientX + second.clientX) / 2,
  clientY: (first.clientY + second.clientY) / 2,
});

const stopPropagation = (fn) => (arg) => {
  if (!arg.event.isPropagationStopped || !arg.event.isPropagationStopped())
    return fn(arg);
  return null;
};
const protect =
  (fn) =>
  async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error(error);
    }
  };
class PromiseQueue {
  lastPromise = Promise.resolve(true);
  add(operation, ...args) {
    return new Promise((resolve, reject) => {
      this.lastPromise = this.lastPromise
        .then(() => stopPropagation(protect(operation))(...args))
        .then(resolve)
        .catch(reject);
    });
  }
}
const promiseQueue = new PromiseQueue();

const Gesture = ({
  children,
  onDrag = empty,
  onDragStart = empty,
  onDragEnd = empty,
  onPan = empty,
  onTap = empty,
  onLongTap = empty,
  onDoubleTap = empty,
  onZoom,
  mainAction = "drag",
  navigationMode,
  zoomMultiplier = 1,
  fill = false,
}) => {
  const wrapperRef = React.useRef(null);
  const stateRef = React.useRef({ pointers: {}, activePair: [] });

  const queueDragEnd = (event) => {
    const state = stateRef.current;
    if (state.gestureAction !== "drag") return;
    promiseQueue.add(onDragEnd, {
      deltaX: 0,
      deltaY: 0,
      startX: state.startX,
      startY: state.startY,
      clientX: event.clientX,
      clientY: event.clientY,
      distanceX: event.clientX - state.startX,
      distanceY: event.clientY - state.startY,
      button: state.currentButton,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      event,
    });
    state.gestureAction = undefined;
  };

  const resetSingleReference = () => {
    const state = stateRef.current;
    const pointer = Object.values(state.pointers)[0];
    if (!pointer) return;
    Object.assign(state, {
      mainPointer: pointer.pointerId,
      startX: pointer.clientX,
      startY: pointer.clientY,
      prevX: pointer.clientX,
      prevY: pointer.clientY,
      gestureAction: undefined,
    });
  };

  const beginPair = (event) => {
    const state = stateRef.current;
    const touches = Object.values(state.pointers).filter(
      (pointer) => pointer.pointerType === "touch"
    );
    if (state.activePair.length || touches.length < 2) return;
    // Lock the first two touches. Extra fingers are captured and cleaned up,
    // but never change the midpoint used by this gesture.
    const [first, second] = touches;
    const center = centerOf(first, second);
    queueDragEnd(event);
    clearTimeout(state.longTapTimeout);
    Object.assign(state, {
      activePair: [first.pointerId, second.pointerId],
      prevX: center.clientX,
      prevY: center.clientY,
      prevDistance: distance(
        [first.clientX, first.clientY],
        [second.clientX, second.clientY]
      ),
      multiMode: undefined,
      multiMoveEvent: undefined,
      multiMoveTimeout: undefined,
      gestureAction: "pan",
      hadMultiTouch: true,
      noTap: true,
    });
  };

  const flushMultiMove = () => {
    const state = stateRef.current;
    state.multiMoveTimeout = undefined;
    const [firstId, secondId] = state.activePair;
    const event = state.multiMoveEvent;
    const first = state.pointers[firstId];
    const second = state.pointers[secondId];
    if (!event || !first || !second) return;

    const center = centerOf(first, second);
    const currentDistance = distance(
      [first.clientX, first.clientY],
      [second.clientX, second.clientY]
    );
    const deltaX = center.clientX - state.prevX;
    const deltaY = center.clientY - state.prevY;
    const panDistance = Math.hypot(deltaX, deltaY);
    const zoomDistance = Math.abs(currentDistance - state.prevDistance);

    // Pointer moves for the two fingers are dispatched separately. Group them
    // before deciding the gesture so a regular two-finger pan does not briefly
    // look like a pinch while only the first move has arrived. The leading
    // gesture may switch later, but only when the other movement is clearly
    // larger, which prevents jitter from making it oscillate.
    if (!state.multiMode) {
      state.multiMode = panDistance >= zoomDistance ? "pan" : "pinch";
    } else if (
      state.multiMode === "pan" &&
      zoomDistance > panDistance * GESTURE_SWITCH_RATIO
    ) {
      state.multiMode = "pinch";
    } else if (
      state.multiMode === "pinch" &&
      panDistance > zoomDistance * GESTURE_SWITCH_RATIO
    ) {
      state.multiMode = "pan";
    }

    clearTimeout(state.longTapTimeout);
    if (state.multiMode === "pan") {
      promiseQueue.add(onPan, {
        deltaX,
        deltaY,
        button: state.currentButton,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        target: state.target,
        source: "touch",
        isMultiTouch: true,
        event,
      });
    } else if (onZoom && currentDistance !== state.prevDistance) {
      promiseQueue.add(onZoom, {
        scale: (state.prevDistance - currentDistance) * 3,
        clientX: center.clientX,
        clientY: center.clientY,
        event,
      });
    }
    Object.assign(state, {
      prevX: center.clientX,
      prevY: center.clientY,
      prevDistance: currentDistance,
      moving: true,
      multiMoveEvent: undefined,
    });
  };

  const onWheel = React.useCallback(
    (event) => {
      const {
        deltaX,
        deltaY,
        clientX,
        clientY,
        deltaMode,
        ctrlKey,
        metaKey,
        target,
      } = event;
      const trackpadNavigation = navigationMode === "trackpad" && !ctrlKey;
      const shouldZoom =
        navigationMode === "wheel" ||
        (navigationMode === "trackpad" && ctrlKey);
      if (trackpadNavigation) {
        promiseQueue.add(onPan, {
          deltaX: -2 * deltaX,
          deltaY: -2 * deltaY,
          button: 1,
          source: "wheel",
          ctrlKey,
          metaKey,
          target,
          event,
        });
        event.preventDefault();
        return;
      }
      if (!shouldZoom || onZoom === undefined || !deltaY) return;
      let scale = deltaY;
      if (deltaMode === 1) scale *= LINE_HEIGHT;
      if (deltaMode === 2) scale *= PAGE_HEIGHT;
      promiseQueue.add(onZoom, {
        scale: scale * zoomMultiplier,
        clientX,
        clientY,
        event,
      });
      event.preventDefault();
    },
    [navigationMode, onPan, onZoom, zoomMultiplier]
  );

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !navigationMode) return undefined;
    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, [navigationMode, onWheel]);

  const onPointerDown = (event) => {
    const state = stateRef.current;
    const { pointerId, pointerType, clientX, clientY, target } = event;
    // Safari/WebViews have historically omitted pointerType on some touch
    // PointerEvents. A real mouse always reports "mouse"; treat an omitted
    // type as touch so it cannot disable pinch navigation.
    state.pointers[pointerId] = {
      pointerId,
      pointerType: pointerType || "touch",
      clientX,
      clientY,
    };
    try {
      target.setPointerCapture(pointerId);
    } catch {
      /* synthetic events may not capture */
    }
    if (Object.keys(state.pointers).length === 1) {
      Object.assign(state, {
        pressed: true,
        moving: false,
        gestureAction: undefined,
        hadMultiTouch: false,
        noTap: false,
        mainPointer: pointerId,
        startX: clientX,
        startY: clientY,
        prevX: clientX,
        prevY: clientY,
        currentButton: event.button,
        pointerDownEvent: event,
        target,
        timeStart: Date.now(),
        activePair: [],
        longTapTimeout: setTimeout(() => {
          state.noTap = true;
          promiseQueue.add(onLongTap, {
            clientX,
            clientY,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            target,
            event,
          });
        }, 750),
      });
    }
    beginPair(event);
  };

  const onPointerMove = (event) => {
    const state = stateRef.current;
    if (!state.pressed || !state.pointers[event.pointerId]) return;
    state.pointers[event.pointerId] = {
      ...state.pointers[event.pointerId],
      clientX: event.clientX,
      clientY: event.clientY,
    };
    const [firstId, secondId] = state.activePair;
    if (state.activePair.length === 2) {
      if (event.pointerId !== firstId && event.pointerId !== secondId) return;
      state.multiMoveEvent = event;
      if (!state.multiMoveTimeout) {
        state.multiMoveTimeout = setTimeout(flushMultiMove, 0);
      }
      return;
    }
    if (event.pointerId !== state.mainPointer) return;
    const { clientX, clientY } = event;
    const currentMainAction = getMainAction(
      mainAction,
      state.pointers[event.pointerId].pointerType,
      navigationMode
    );
    let altAction =
      event.shiftKey ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.buttons !== 1;
    if (currentMainAction !== "drag") altAction = !altAction;
    const shouldDrag = !altAction;
    const isTouch = state.pointers[event.pointerId].pointerType === "touch";
    if (
      shouldDrag &&
      isTouch &&
      !state.gestureAction &&
      Math.hypot(clientX - state.startX, clientY - state.startY) <
        TOUCH_DRAG_THRESHOLD
    )
      return;
    if (!state.gestureAction) {
      state.gestureAction = shouldDrag ? "drag" : "pan";
      clearTimeout(state.longTapTimeout);
      if (wrapperRef.current) wrapperRef.current.style.cursor = "move";
      if (shouldDrag)
        promiseQueue.add(onDragStart, {
          deltaX: 0,
          deltaY: 0,
          startX: state.startX,
          startY: state.startY,
          clientX: state.startX,
          clientY: state.startY,
          distanceX: 0,
          distanceY: 0,
          button: state.currentButton,
          altKey: event.altKey,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          target: state.target,
          event: state.pointerDownEvent,
        });
    }
    const payload = {
      deltaX: clientX - state.prevX,
      deltaY: clientY - state.prevY,
      startX: state.startX,
      startY: state.startY,
      clientX,
      clientY,
      distanceX: clientX - state.startX,
      distanceY: clientY - state.startY,
      button: state.currentButton,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      target: state.target,
      event,
    };
    promiseQueue.add(
      shouldDrag ? onDrag : onPan,
      shouldDrag
        ? payload
        : {
            ...payload,
            source: isTouch ? "touch" : undefined,
            isMultiTouch: false,
          }
    );
    Object.assign(state, { prevX: clientX, prevY: clientY, moving: true });
  };

  const onPointerUp = (event) => {
    const state = stateRef.current;
    if (!state.pointers[event.pointerId]) return;
    if (state.multiMoveTimeout) {
      clearTimeout(state.multiMoveTimeout);
      flushMultiMove();
    }
    if (event.type === "pointercancel") state.noTap = true;
    try {
      event.target.releasePointerCapture(event.pointerId);
    } catch {
      /* capture can already be released */
    }
    const wasPairMember = state.activePair.includes(event.pointerId);
    delete state.pointers[event.pointerId];
    if (wasPairMember) {
      state.activePair = [];
      const touches = Object.values(state.pointers).filter(
        (pointer) => pointer.pointerType === "touch"
      );
      if (touches.length >= 2) beginPair(event);
      else resetSingleReference();
    }
    if (Object.keys(state.pointers).length) return;
    clearTimeout(state.longTapTimeout);
    state.pressed = false;
    state.mainPointer = undefined;
    state.activePair = [];
    if (state.gestureAction === "drag") queueDragEnd(event);
    if (wrapperRef.current) wrapperRef.current.style.cursor = "auto";
    if (
      !state.moving &&
      !state.hadMultiTouch &&
      !state.noTap &&
      Date.now() - state.timeStart < 300
    ) {
      promiseQueue.add(onTap, {
        clientX: event.clientX,
        clientY: event.clientY,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        target: event.target,
        event,
      });
    }
    Object.assign(state, { moving: false, gestureAction: undefined });
  };

  const onDoubleTapHandler = (event) =>
    promiseQueue.add(onDoubleTap, {
      clientX: event.clientX,
      clientY: event.clientY,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      target: event.target,
      event,
    });

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleTapHandler}
      onDragStart={(event) => event.preventDefault()}
      style={{
        touchAction: "none",
        ...(fill ? { position: "absolute", inset: 0 } : {}),
      }}
      ref={wrapperRef}
    >
      {children}
    </div>
  );
};

export default Gesture;
