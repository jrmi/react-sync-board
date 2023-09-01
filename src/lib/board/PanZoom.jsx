import React from "react";
import { useEventListener } from "@react-hookz/web/esm/useEventListener";

import Gesture from "./Gesture";
import useDim from "./useDim";
import useMousePosition from "./useMousePosition";
import usePositionNavigator from "./usePositionNavigator";
import useMainStore from "./store/main";

const PanZoom = ({ children, moveFirst = false }) => {
  const wrappedRef = React.useRef(null);
  const [
    dim,
    itemExtentGlobal,
    getConfiguration,
    updateBoardState,
    getSelection,
  ] = useMainStore((state) => [
    {
      translateX: state.boardState.translateX,
      translateY: state.boardState.translateY,
      scale: state.boardState.scale,
      rotate: state.boardState.rotate,
    },
    state.config.itemExtent,
    state.getConfiguration,
    state.updateBoardState,
    state.getSelection,
  ]);
  const { zoomToCenter, zoomToExtent, moveBoard } = useDim();

  const [centered, setCentered] = React.useState(false);
  const timeoutRef = React.useRef({});

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

  const onZoom = ({ clientX, clientY, scale }) => {
    zoomToCenter({ to: { x: clientX, y: clientY }, factor: 1 - scale / 500 });

    // Update the board zooming state
    clearTimeout(timeoutRef.current.zoom);
    timeoutRef.current.zoom = setTimeout(() => {
      updateBoardState({ zooming: false });
    }, 200);
    updateBoardState({ zooming: true });
  };

  const onPan = ({ deltaX, deltaY }) => {
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
      onPan={onPan}
      onZoom={onZoom}
      mainAction={moveFirst ? "pan" : "drag"}
    >
      <div
        style={{
          display: "inline-block",
          transformOrigin: "top left",
          transform: `translate(${dim.translateX}px, ${dim.translateY}px) rotate(${dim.rotate}deg) scale(${dim.scale})`,
        }}
        className={`board-pane${dim.scale < 0.5 ? " board-pane__far" : ""}`}
        ref={wrappedRef}
      >
        {children}
      </div>
    </Gesture>
  );
};

export default PanZoom;
