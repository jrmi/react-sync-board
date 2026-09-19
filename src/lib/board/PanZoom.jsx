import React from "react";
import { useEventListener } from "@react-hookz/web";

import Gesture from "./Gesture";
import useDim from "./useDim";
import useMousePosition from "./useMousePosition";
import usePositionNavigator from "./usePositionNavigator";
import useMainStore from "./store/main";
import { hasClass, insideClass } from "@/utils";

const PanZoom = ({
  children,
  mainAction = "auto",
  navigationMode = "auto",
  zoomMultiplier = 1,
  inertia = true,
  inertiaAmount = 1,
}) => {
  const wrappedRef = React.useRef(null);
  const [itemExtentGlobal, getConfiguration, updateBoardState, getSelection] =
    useMainStore((state) => [
      state.config.itemExtent,
      state.getConfiguration,
      state.updateBoardState,
      state.getSelection,
    ]);
  const { zoomToCenter, zoomToExtent, moveBoard } = useDim();

  const [centered, setCentered] = React.useState(false);
  const timeoutRef = React.useRef({});
  const momentumRef = React.useRef({});
  const zoomMomentumRef = React.useRef({});

  const stopMomentum = React.useCallback(() => {
    if (momentumRef.current.frame) {
      cancelAnimationFrame(momentumRef.current.frame);
    }
    clearTimeout(momentumRef.current.endTimeout);
    momentumRef.current.frame = undefined;
    momentumRef.current.endTimeout = undefined;
  }, []);

  const stopZoomMomentum = React.useCallback(() => {
    if (zoomMomentumRef.current.frame) {
      cancelAnimationFrame(zoomMomentumRef.current.frame);
    }
    clearTimeout(zoomMomentumRef.current.endTimeout);
    zoomMomentumRef.current.frame = undefined;
    zoomMomentumRef.current.endTimeout = undefined;
  }, []);

  React.useEffect(
    () => () => {
      stopMomentum();
      momentumRef.current = {};
      stopZoomMomentum();
      zoomMomentumRef.current = {};
    },
    [stopMomentum, stopZoomMomentum]
  );

  React.useEffect(() => {
    if (!inertia) {
      stopMomentum();
      stopZoomMomentum();
    }
  }, [inertia, stopMomentum, stopZoomMomentum]);

  // Get mouse position and hover status
  const getMouseInfo = useMousePosition(wrappedRef);

  // Hooks to save/restore position
  usePositionNavigator();

  /**
   * Center board on startup
   */
  const centerBoard = React.useCallback(() => {
    const { itemExtent } = getConfiguration();
    zoomToExtent(itemExtent);
  }, [getConfiguration, zoomToExtent]);

  React.useEffect(() => {
    if (!centered && itemExtentGlobal.radius) {
      // Center board on first valid extent
      centerBoard();
      setCentered(true);
    }
  }, [centerBoard, centered, itemExtentGlobal]);

  const onZoom = ({ clientX, clientY, scale, source, event }) => {
    stopMomentum();
    stopZoomMomentum();
    const time = event.timeStamp;
    const previous = zoomMomentumRef.current;
    const elapsed = time - previous.time;
    zoomMomentumRef.current.velocity =
      elapsed > 0 && elapsed < 100 ? scale / elapsed : 0;
    Object.assign(zoomMomentumRef.current, { time, clientX, clientY });
    zoomToCenter({ to: { x: clientX, y: clientY }, factor: 1 - scale / 500 });

    // Update the board zooming state
    clearTimeout(timeoutRef.current.zoom);
    timeoutRef.current.zoom = setTimeout(() => {
      updateBoardState({ zooming: false });
    }, 200);
    updateBoardState({ zooming: true });
    if (inertia && source === "wheel") {
      zoomMomentumRef.current.endTimeout = setTimeout(onZoomEnd, 100);
    }
  };

  const onZoomEnd = () => {
    clearTimeout(zoomMomentumRef.current.endTimeout);
    zoomMomentumRef.current.endTimeout = undefined;
    if (!inertia) return;
    zoomMomentumRef.current.velocity *= inertiaAmount;
    if (Math.abs(zoomMomentumRef.current.velocity || 0) < 0.05) return;
    const animate = () => {
      const momentum = zoomMomentumRef.current;
      momentum.velocity *= 0.9;
      if (Math.abs(momentum.velocity) < 0.02) {
        stopZoomMomentum();
        return;
      }
      zoomToCenter({
        to: { x: momentum.clientX, y: momentum.clientY },
        factor: 1 - (momentum.velocity * 16) / 500,
      });
      momentum.frame = requestAnimationFrame(animate);
    };
    zoomMomentumRef.current.frame = requestAnimationFrame(animate);
  };

  const onPan = ({ deltaX, deltaY, target, source, isMultiTouch, event }) => {
    const item = insideClass(target, "item");
    if (
      source !== "wheel" &&
      !(source === "touch" && isMultiTouch) &&
      item &&
      hasClass(item, "selected")
    ) {
      return;
    }

    stopMomentum();
    stopZoomMomentum();
    const time = event.timeStamp;
    const previous = momentumRef.current;
    const elapsed = time - previous.time;
    if (elapsed > 0 && elapsed < 100) {
      momentumRef.current.velocityX = deltaX / elapsed;
      momentumRef.current.velocityY = deltaY / elapsed;
    } else {
      momentumRef.current.velocityX = 0;
      momentumRef.current.velocityY = 0;
    }
    momentumRef.current.time = time;

    moveBoard(({ translateX, translateY }) => ({
      translateX: translateX + deltaX,
      translateY: translateY + deltaY,
    }));

    // update the board panning state
    clearTimeout(timeoutRef.current.pan);
    timeoutRef.current.pan = setTimeout(() => {
      updateBoardState({ panning: false });
    }, 200);
    updateBoardState({ panning: true });

    if (inertia && source === "wheel") {
      momentumRef.current.endTimeout = setTimeout(onPanEnd, 100);
    }
  };

  const onPanEnd = () => {
    clearTimeout(momentumRef.current.endTimeout);
    momentumRef.current.endTimeout = undefined;
    if (!inertia) return;
    momentumRef.current.velocityX *= inertiaAmount;
    momentumRef.current.velocityY *= inertiaAmount;
    const { velocityX = 0, velocityY = 0 } = momentumRef.current;
    if (Math.hypot(velocityX, velocityY) < 0.05) return;

    const animate = () => {
      const momentum = momentumRef.current;
      momentum.velocityX *= 0.92;
      momentum.velocityY *= 0.92;
      if (Math.hypot(momentum.velocityX, momentum.velocityY) < 0.02) {
        stopMomentum();
        return;
      }
      moveBoard(({ translateX, translateY }) => ({
        translateX: translateX + momentum.velocityX * 16,
        translateY: translateY + momentum.velocityY * 16,
      }));
      momentum.frame = requestAnimationFrame(animate);
    };
    momentumRef.current.frame = requestAnimationFrame(animate);
  };

  const onKeyDown = (e) => {
    // Block shortcut if we are typing in a textarea or input
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

    let moveX = 0;
    let moveY = 0;
    let zoom = 1;
    switch (e.key) {
      case "ArrowLeft":
        moveX = -10;
        break;
      case "ArrowRight":
        moveX = 10;
        break;
      case "ArrowUp":
        moveY = -10;
        break;
      case "ArrowDown":
        moveY = 10;
        break;
      case "PageUp":
        zoom = 1.2;
        break;
      case "PageDown":
        zoom = 0.8;
        break;
      default:
    }
    if (moveX || moveY || zoom !== 1) {
      // Don't move board if moving item
      const selectedItems = getSelection();
      if (zoom === 1 && selectedItems.length) {
        return;
      }
      if (e.shiftKey) {
        moveX *= 5;
        moveY *= 5;
      }
      if (e.ctrlKey || e.altKey || e.metaKey) {
        moveX /= 5;
        moveY /= 5;
      }

      moveBoard(({ translateX, translateY }) => ({
        translateX: translateX + moveX,
        translateY: translateY + moveY,
      }));

      zoomToCenter({ factor: zoom });

      e.preventDefault();
    }
    // Temporary zoom
    if (e.key === " " && !e.repeat) {
      if (getMouseInfo().hover) {
        zoomToCenter({ factor: 3, to: getMouseInfo() });
      }
    }
  };

  const onKeyUp = (e) => {
    // Ignore text in Input or Textarea
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

    // Zoom out on release
    if (e.key === " " && getMouseInfo().hover) {
      zoomToCenter({ factor: 1 / 3, to: getMouseInfo() });
    }
  };

  useEventListener(document, "keydown", onKeyDown);
  useEventListener(document, "keyup", onKeyUp);

  return (
    <Gesture
      fill
      onPan={onPan}
      onPanEnd={onPanEnd}
      onZoom={onZoom}
      onZoomEnd={onZoomEnd}
      mainAction={mainAction}
      navigationMode={navigationMode}
      zoomMultiplier={zoomMultiplier}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "block",
          width: "100%",
          height: "100%",
        }}
        className="board"
        ref={wrappedRef}
      >
        {children}
      </div>
    </Gesture>
  );
};

export default PanZoom;
