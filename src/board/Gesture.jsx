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
  const queueRef = React.useRef([]);

  // Queue event to avoid async mess
  const queue = React.useCallback((callback, args) => {
    queueRef.current.push(async () => {
      await protect(callback)(args);
      queueRef.current.shift();
      if (queueRef.current.length !== 0) {
        await protect(queueRef.current[0])();
      }
    });
    if (queueRef.current.length === 1) {
      protect(queueRef.current[0])();
    }
  }, []);

  const onWheel = React.useCallback(
    (e) => {
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
      } = e;

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
        queue(onPan, {
          deltaX: -2 * deltaX,
          deltaY: -2 * deltaY,
          button: 1,
          ctrlKey,
          metaKey,
          target,
          event: e,
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

        queue(onZoom, { scale, clientX, clientY, event: e });
      }
    },
    [onPan, onZoom, queue]
  );

  const onPointerDown = React.useCallback(
    ({
      target,
      button,
      clientX,
      clientY,
      pointerId,
      altKey,
      ctrlKey,
      metaKey,
      isPrimary,
    }) => {
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

            // We update previous position as the new position is the center beetween both finger
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
        target,
        timeStart: Date.now(),
        longTapTimeout: setTimeout(async () => {
          stateRef.current.noTap = true;
          queue(onLongTap, {
            clientX,
            clientY,
            altKey,
            ctrlKey,
            metaKey,
            target,
          });
        }, 750),
      });

      try {
        target.setPointerCapture(pointerId);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Fail to capture pointer", e);
      }
    },
    [onLongTap, queue]
  );

  const onPointerMove = React.useCallback(
    (e) => {
      if (stateRef.current.pressed) {
        const {
          pointerId,
          clientX: eventClientX,
          clientY: eventClientY,
          altKey,
          ctrlKey,
          metaKey,
          buttons,
          pointerType,
        } = e;

        if (stateRef.current.mainPointer !== pointerId) {
          // Event from other pointer
          stateRef.current.pointers[pointerId] = {
            clientX: eventClientX,
            clientY: eventClientY,
          };
          return;
        }

        stateRef.current.moving = true;

        // Do we have two fingers ?
        const twoFingers = Object.keys(stateRef.current.pointers).length === 2;

        let clientX;
        let clientY;
        let distance;

        if (twoFingers) {
          // Find other pointerId
          const { clientX: clientX2, clientY: clientY2 } = otherPointer(
            stateRef.current.pointers,
            pointerId
          );

          // Update client X with the center of each touch
          clientX = (clientX2 + eventClientX) / 2;
          clientY = (clientY2 + eventClientY) / 2;
          distance = computeDistance(
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
        let altAction = altKey || ctrlKey || metaKey || buttons !== 1;
        if (mainAction !== "drag") {
          altAction = !altAction;
        }

        const shouldDrag = pointerType !== "touch" ? !altAction : !twoFingers;
        const shouldPan = pointerType !== "touch" ? altAction : twoFingers;

        if (shouldDrag) {
          // Send drag start on first move
          if (!stateRef.current.gestureStart) {
            wrapperRef.current.style.cursor = "move";
            stateRef.current.gestureStart = true;
            // Clear tap timeout
            clearTimeout(stateRef.current.longTapTimeout);

            queue(onDragStart, {
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
              ctrlKey,
              metaKey,
              target: stateRef.current.target,
              event: e,
            });
          }
          // Create closure
          const deltaX = clientX - stateRef.current.prevX;
          const deltaY = clientY - stateRef.current.prevY;
          const distanceX = clientX - stateRef.current.startX;
          const distanceY = clientY - stateRef.current.startY;

          // Drag event
          queue(onDrag, {
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
            ctrlKey,
            metaKey,
            target: stateRef.current.target,
            event: e,
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
          queue(onPan, {
            deltaX,
            deltaY,
            button: stateRef.current.currentButton,
            altKey,
            ctrlKey,
            metaKey,
            target,
            event: e,
          });

          if (
            twoFingers &&
            distance !== stateRef.current.prevDistance &&
            onZoom
          ) {
            const scale = stateRef.current.prevDistance - distance;

            if (Math.abs(scale) > 0) {
              queue(onZoom, {
                scale,
                clientX,
                clientY,
                event: e,
              });
              stateRef.current.prevDistance = distance;
            }
          }
        }

        stateRef.current.prevX = clientX;
        stateRef.current.prevY = clientY;
      }
    },
    [mainAction, onDrag, onDragStart, onPan, onZoom, queue]
  );

  const onPointerUp = React.useCallback(
    (e) => {
      const { clientX, clientY, altKey, ctrlKey, metaKey, target, pointerId } =
        e;

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
          stateRef.current.target.setPointerCapture(
            stateRef.current.mainPointer
          );
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
        queue(onDragEnd, {
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
          ctrlKey,
          metaKey,
          event: e,
        });
        wrapperRef.current.style.cursor = "auto";
      } else {
        const now = Date.now();

        if (stateRef.current.noTap) {
          stateRef.current.noTap = false;
        }
        // Send tap event only if time less than 300ms
        else if (stateRef.current.timeStart - now < 300) {
          queue(onTap, {
            clientX,
            clientY,
            altKey,
            ctrlKey,
            metaKey,
            target,
          });
        }
      }
    },
    [onDragEnd, onTap, queue]
  );

  const onDoubleTapHandler = React.useCallback(
    (event) => {
      queue(onDoubleTap, event);
    },
    [onDoubleTap, queue]
  );

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
