import React from "react";

import { useRecoilValue, useSetRecoilState } from "recoil";
import { BoardTransformAtom, BoardStateAtom } from "./atoms";

import Gesture from "./Gesture";
import useDim from "./useDim";
import useMousePosition from "./useMousePosition";
import usePositionNavigator from "./usePositionNavigator";
import useSelection from "./store/selection";
import useMainStore from "./store/main";

const PanZoom = ({ children, moveFirst = false }) => {
  const wrappedRef = React.useRef(null);
  const dim = useRecoilValue(BoardTransformAtom);
  const { setDim, zoomToCenter, zoomToExtent } = useDim();
  const [itemExtentGlobal, getConfiguration] = useMainStore((state) => [
    state.config.itemExtent,
    state.getConfiguration,
  ]);
  const [centered, setCentered] = React.useState(false);
  const setBoardState = useSetRecoilState(BoardStateAtom);
  const timeoutRef = React.useRef({});
  const getSelection = useSelection((state) => state.getSelection);

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
    if (!centered && itemExtentGlobal.left) {
      // Center board on first valid extent
      centerBoard();
      setCentered(true);
    }
  }, [centerBoard, centered, itemExtentGlobal]);

  const onZoom = React.useCallback(
    ({ clientX, clientY, scale }) => {
      zoomToCenter(1 - scale / 500, { x: clientX, y: clientY });

      // Update the board zooming state
      clearTimeout(timeoutRef.current.zoom);
      timeoutRef.current.zoom = setTimeout(() => {
        setBoardState((prev) =>
          prev.zooming ? { ...prev, zooming: false } : prev
        );
      }, 200);
      setBoardState((prev) =>
        !prev.zooming ? { ...prev, zooming: true } : prev
      );
    },
    [setBoardState, zoomToCenter]
  );

  const onPan = React.useCallback(
    async ({ deltaX, deltaY }) => {
      setDim((prev) => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY,
      }));

      // update the board panning state
      clearTimeout(timeoutRef.current.pan);
      timeoutRef.current.pan = setTimeout(() => {
        setBoardState((prev) =>
          prev.panning ? { ...prev, panning: false } : prev
        );
      }, 200);
      setBoardState((prev) =>
        !prev.panning ? { ...prev, panning: true } : prev
      );
    },
    [setBoardState, setDim]
  );

  const onKeyDown = React.useCallback(
    (e) => {
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
        setDim((prev) => ({
          ...prev,
          translateY: prev.translateY + moveY,
          translateX: prev.translateX + moveX,
        }));

        zoomToCenter(zoom);

        e.preventDefault();
      }
      // Temporary zoom
      if (e.key === " " && !e.repeat) {
        if (getMouseInfo().hover) {
          zoomToCenter(3, getMouseInfo());
        }
      }
    },
    [getSelection, setDim, zoomToCenter, getMouseInfo]
  );

  const onKeyUp = React.useCallback(
    (e) => {
      // Ignore text in Input or Textarea
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      // Zoom out on release
      if (e.key === " " && getMouseInfo().hover) {
        zoomToCenter(1 / 3, getMouseInfo());
      }
    },
    [getMouseInfo, zoomToCenter]
  );

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

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
          transform: `translate(${dim.translateX}px, ${dim.translateY}px) scale(${dim.scale})`,
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
