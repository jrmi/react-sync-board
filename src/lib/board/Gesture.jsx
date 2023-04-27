import React from "react";

export const isMacOS = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /mac os ?x 10/.test(userAgent);
};

// From https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
const getScrollLineHeight = () => {
  const iframe = document.createElement("iframe");
  iframe.src = "#";
  document.body.appendChild(iframe);

  // Write content in Iframe
  const idoc = iframe.contentWindow.document;
  idoc.open();
  idoc.write(
    "<!DOCTYPE html><html><head></head><body><span>a</span></body></html>"
  );
  idoc.close();

  const scrollLineHeight = idoc.body.firstElementChild.offsetHeight;
  document.body.removeChild(iframe);

  return scrollLineHeight;
};

const LINE_HEIGHT = getScrollLineHeight();
// Reasonable default from https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
const PAGE_HEIGHT = 800;

const otherPointer = (pointers, currentPointer) => {
  const p2 = Object.keys(pointers)
    .map((p) => Number(p))
    .find((pointer) => pointer !== currentPointer);
  return pointers[p2];
};

const computeDistance = ([x1, y1], [x2, y2]) => {
  const distanceX = Math.abs(x1 - x2);
  const distanceY = Math.abs(y1 - y2);

  return Math.hypot(distanceX, distanceY);
};

const empty = () => {};

const stopPropagation = (fn) => (arg) => {
  const { event } = arg;
  if (!event.isPropagationStopped()) {
    return fn(arg);
  }
  return null;
};

const protect =
  (fn) =>
  async (...args) => {
    try {
      await fn(...args);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
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
}) => {
  const wrapperRef = React.useRef(null);
  const stateRef = React.useRef({
    moving: false,
    pointers: {},
    mainPointer: undefined,
  });

  const onWheel = (event) => {
    const {
      deltaX,
      deltaY,
      clientX,
      clientY,
      deltaMode,
      ctrlKey,
      altKey,
      metaKey,
      target,
    } = event;

    // On a MacOs trackpad, the pinch gesture sets the ctrlKey to true.
    // In that situation, we want to use the custom scaling, not the browser default zoom.
    // Hence in this situation we avoid to return immediately.
    if (altKey || (ctrlKey && !isMacOS())) {
      return;
    }

    // On a trackpad, the pinch and pan events are differentiated by the crtlKey value.
    // On a pinch gesture, the ctrlKey is set to true, so we want to have a scaling effect.
    // If we are only moving the fingers in the same direction, a pan is needed.
    // Ref: https://medium.com/@auchenberg/detecting-multi-touch-trackpad-gestures-in-javascript-a2505babb10e
    if (isMacOS() && !ctrlKey) {
      promiseQueue.add(onPan, {
        deltaX: -2 * deltaX,
        deltaY: -2 * deltaY,
        button: 1,
        ctrlKey,
        metaKey,
        target,
        event,
      });
    } else {
      // Quit if onZoom is not set
      if (onZoom === undefined || !deltaY) return;

      let scale = deltaY;

      switch (deltaMode) {
        case 1: // Pixel
          scale *= LINE_HEIGHT;
          break;
        case 2:
          scale *= PAGE_HEIGHT;
          break;
        default:
      }

      if (isMacOS()) {
        scale *= 2;
      }

      promiseQueue.add(onZoom, { scale, clientX, clientY, event });
    }
  };

  const onPointerDown = (event) => {
    const {
      target,
      button,
      clientX,
      clientY,
      pointerId,
      altKey,
      ctrlKey,
      metaKey,
      isPrimary,
    } = event;

    // Add pointer to map
    stateRef.current.pointers[pointerId] = { clientX, clientY };

    if (isPrimary) {
      // Clean mainPoint on primary pointer
      stateRef.current.mainPointer = undefined;
    }

    if (stateRef.current.mainPointer !== undefined) {
      if (stateRef.current.mainPointer !== pointerId) {
        // This is not the main pointer
        try {
          const { clientX: clientX2, clientY: clientY2 } = otherPointer(
            stateRef.current.pointers,
            pointerId
          );
          const newClientX = (clientX2 + clientX) / 2;
          const newClientY = (clientY2 + clientY) / 2;

          const distance = computeDistance(
            [clientX2, clientY2],
            [clientX, clientY]
          );

          // We update previous position as the new position is the center between both fingers
          Object.assign(stateRef.current, {
            pressed: true,
            moving: false,
            gestureStart: false,
            startX: clientX,
            startY: clientY,
            prevX: newClientX,
            prevY: newClientY,
            startDistance: distance,
            prevDistance: distance,
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log("Error while getting other pointer. Ignoring", e);
          // eslint-disable-next-line no-unused-expressions
          stateRef.current.mainPointer === undefined;
        }
      }

      return;
    }

    // We set the mainpointer
    stateRef.current.mainPointer = pointerId;

    // And prepare move
    Object.assign(stateRef.current, {
      pressed: true,
      moving: false,
      gestureStart: false,
      startX: clientX,
      startY: clientY,
      prevX: clientX,
      prevY: clientY,
      currentButton: button,
      pointerDownEvent: event,
      target,
      timeStart: Date.now(),
      longTapTimeout: setTimeout(async () => {
        stateRef.current.noTap = true;
        promiseQueue.add(onLongTap, {
          clientX,
          clientY,
          altKey,
          ctrlKey,
          metaKey,
          target,
          event,
        });
      }, 750),
    });

    try {
      target.setPointerCapture(pointerId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Fail to capture pointer", e);
    }
  };

  const onPointerMove = (event) => {
    if (stateRef.current.pressed) {
      const {
        pointerId,
        clientX: eventClientX,
        clientY: eventClientY,
        altKey,
        shiftKey,
        ctrlKey,
        metaKey,
        buttons,
        pointerType,
      } = event;

      // Update pointer coordinates in the map
      stateRef.current.pointers[pointerId] = {
        clientX: eventClientX,
        clientY: eventClientY,
      };

      stateRef.current.moving = true;

      // Do we have two pointers ?
      const twoPointers = Object.keys(stateRef.current.pointers).length === 2;

      let clientX;
      let clientY;
      let distanceBetweenTwoPointers;

      if (twoPointers) {
        // Find other pointerId
        const { clientX: clientX2, clientY: clientY2 } = otherPointer(
          stateRef.current.pointers,
          pointerId
        );

        // Update client X with the center of each touch
        clientX = (clientX2 + eventClientX) / 2;
        clientY = (clientY2 + eventClientY) / 2;
        distanceBetweenTwoPointers = computeDistance(
          [clientX2, clientY2],
          [eventClientX, eventClientY]
        );
      } else {
        clientX = eventClientX;
        clientY = eventClientY;
      }

      // We drag if
      // On non touch device
      //   - Only button is pressed (1)
      //   - any special key is no pressed
      // or on touch devices
      //   - We use only one finger
      let altAction = shiftKey || altKey || ctrlKey || metaKey || buttons !== 1;
      if (mainAction !== "drag") {
        altAction = !altAction;
      }

      const shouldDrag = !altAction;
      const shouldPan = altAction;

      if (shouldDrag) {
        // Send drag start on first move
        if (!stateRef.current.gestureStart) {
          wrapperRef.current.style.cursor = "move";
          stateRef.current.gestureStart = true;
          // Clear tap timeout
          clearTimeout(stateRef.current.longTapTimeout);

          promiseQueue.add(onDragStart, {
            deltaX: 0,
            deltaY: 0,
            startX: stateRef.current.startX,
            startY: stateRef.current.startY,
            clientX: stateRef.current.startX,
            clientY: stateRef.current.startY,
            distanceX: 0,
            distanceY: 0,
            button: stateRef.current.currentButton,
            altKey,
            shiftKey,
            ctrlKey,
            metaKey,
            target: stateRef.current.target,
            event: stateRef.current.pointerDownEvent,
          });
        }

        const deltaX = clientX - stateRef.current.prevX;
        const deltaY = clientY - stateRef.current.prevY;
        const distanceX = clientX - stateRef.current.startX;
        const distanceY = clientY - stateRef.current.startY;

        // Drag event
        promiseQueue.add(onDrag, {
          deltaX,
          deltaY,
          startX: stateRef.current.startX,
          startY: stateRef.current.startY,
          clientX,
          clientY,
          distanceX,
          distanceY,
          button: stateRef.current.currentButton,
          altKey,
          shiftKey,
          ctrlKey,
          metaKey,
          target: stateRef.current.target,
          event,
        });
      }

      if (shouldPan) {
        if (!stateRef.current.gestureStart) {
          wrapperRef.current.style.cursor = "move";
          stateRef.current.gestureStart = true;
          // Clear tap timeout on first move
          clearTimeout(stateRef.current.longTapTimeout);
        }

        // Create closure
        const deltaX = clientX - stateRef.current.prevX;
        const deltaY = clientY - stateRef.current.prevY;
        const { target } = stateRef.current;

        // Pan event
        promiseQueue.add(onPan, {
          deltaX,
          deltaY,
          button: stateRef.current.currentButton,
          altKey,
          shiftKey,
          ctrlKey,
          metaKey,
          target,
          event,
        });

        if (
          distanceBetweenTwoPointers !== stateRef.current.prevDistance &&
          onZoom
        ) {
          const scale =
            stateRef.current.prevDistance - distanceBetweenTwoPointers;

          if (Math.abs(scale) > 0) {
            promiseQueue.add(onZoom, {
              scale: scale * 3,
              clientX,
              clientY,
              event,
            });
            stateRef.current.prevDistance = distanceBetweenTwoPointers;
          }
        }
      }

      stateRef.current.prevX = clientX;
      stateRef.current.prevY = clientY;
    }
  };

  const onPointerUp = (event) => {
    const {
      clientX,
      clientY,
      altKey,
      shiftKey,
      ctrlKey,
      metaKey,
      target,
      pointerId,
    } = event;

    if (!stateRef.current.pointers[pointerId]) {
      // Pointer already gone previously with another event
      // ignoring it
      return;
    }

    // Remove pointer from map
    delete stateRef.current.pointers[pointerId];

    if (stateRef.current.mainPointer !== pointerId) {
      // If this is not the main pointer we quit here
      return;
    }

    while (Object.keys(stateRef.current.pointers).length > 0) {
      // If was main pointer but we have another one, this one become main
      stateRef.current.mainPointer = Number(
        Object.keys(stateRef.current.pointers)[0]
      );
      try {
        stateRef.current.target.setPointerCapture(stateRef.current.mainPointer);
        return;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Fails to set pointer capture", error);
        stateRef.current.mainPointer = undefined;
        delete stateRef.current.pointers[
          Object.keys(stateRef.current.pointers)[0]
        ];
      }
    }

    stateRef.current.mainPointer = undefined;
    stateRef.current.pressed = false;

    // Clear longTap
    clearTimeout(stateRef.current.longTapTimeout);

    if (stateRef.current.moving) {
      // If we were moving, send drag end event
      stateRef.current.moving = false;
      promiseQueue.add(onDragEnd, {
        deltaX: clientX - stateRef.current.prevX,
        deltaY: clientY - stateRef.current.prevY,
        startX: stateRef.current.startX,
        startY: stateRef.current.startY,
        clientX,
        clientY,
        distanceX: clientX - stateRef.current.startX,
        distanceY: clientY - stateRef.current.startY,
        button: stateRef.current.currentButton,
        altKey,
        shiftKey,
        ctrlKey,
        metaKey,
        event,
      });
      wrapperRef.current.style.cursor = "auto";
    } else {
      const now = Date.now();

      if (stateRef.current.noTap) {
        stateRef.current.noTap = false;
      }
      // Send tap event only if time less than 300ms
      else if (stateRef.current.timeStart - now < 300) {
        promiseQueue.add(onTap, {
          clientX,
          clientY,
          altKey,
          shiftKey,
          ctrlKey,
          metaKey,
          target,
          event,
        });
      }
    }
  };

  const onDoubleTapHandler = (event) => {
    const { clientX, clientY, altKey, shiftKey, ctrlKey, metaKey, target } =
      event;
    promiseQueue.add(onDoubleTap, {
      clientX,
      clientY,
      altKey,
      shiftKey,
      ctrlKey,
      metaKey,
      target,
      event,
    });
  };

  return (
    <div
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleTapHandler}
      style={{ touchAction: "none" }}
      ref={wrapperRef}
    >
      {children}
    </div>
  );
};

export default Gesture;
