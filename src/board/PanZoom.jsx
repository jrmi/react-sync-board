import React from "react";

import { useRecoilValue, useSetRecoilState, useRecoilCallback } from "recoil";
import { insideClass } from "../utils";
import {
  BoardTransformAtom,
  ConfigurationAtom,
  SelectedItemsAtom,
  BoardStateAtom,
} from "./atoms";

import Gesture from "./Gesture";
import useDim from "./useDim";
import useMousePosition from "./useMousePosition";
import usePositionNavigator from "./usePositionNavigator";

const SCALE_TOLERANCE = 0.8;

const PanZoom = ({ children, moveFirst = false }) => {
  const wrappedRef = React.useRef(null);
  const dim = useRecoilValue(BoardTransformAtom);
  const { setDim, zoomTo } = useDim();
  const { itemExtent: itemExtentGlobal } = useRecoilValue(ConfigurationAtom);
  const [centered, setCentered] = React.useState(false);
  const setBoardState = useSetRecoilState(BoardStateAtom);
  const timeoutRef = React.useRef({});

  // Get mouse position and hover status
  const getMouseInfo = useMousePosition(wrappedRef);

  // Hooks to save/restore position
  usePositionNavigator();

  const centerBoard = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const {
          itemExtent: { left, top, width, height },
          boardWrapperRect,
        } = await snapshot.getPromise(ConfigurationAtom);

        const scaleX = boardWrapperRect.width / width;
        const scaleY = boardWrapperRect.height / height;

        const newScale = Math.min(scaleX, scaleY);

        const scaleWithTolerance = newScale * SCALE_TOLERANCE;

        const centerX =
          boardWrapperRect.width / 2 - (left + width / 2) * scaleWithTolerance;
        const centerY =
          boardWrapperRect.height / 2 - (top + height / 2) * scaleWithTolerance;

        setDim((prev) => ({
          ...prev,
          translateX: centerX,
          translateY: centerY,
          scale: scaleWithTolerance,
        }));
      },
    [setDim]
  );

  React.useEffect(() => {
    if (!centered && itemExtentGlobal.left) {
      // Center board on first valid extent
      centerBoard();
      setCentered(true);
    }
  }, [centerBoard, centered, itemExtentGlobal]);

  const onZoom = React.useCallback(
    ({ clientX, clientY, scale }) => {
      zoomTo(1 - scale / 500, { x: clientX, y: clientY });

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
    [setBoardState, zoomTo]
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

  const onDrag = React.useCallback(
    (state) => {
      const { target } = state;

      const outsideItem =
        !insideClass(target, "item") || insideClass(target, "locked");

      if (moveFirst && outsideItem) {
        onPan(state);
      }
    },
    [moveFirst, onPan]
  );

  const onKeyDown = useRecoilCallback(
    ({ snapshot }) =>
      async (e) => {
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
          const selectedItems = await snapshot.getPromise(SelectedItemsAtom);
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

          zoomTo(zoom);

          e.preventDefault();
        }
        // Temporary zoom
        if (e.key === " " && !e.repeat) {
          if (getMouseInfo().hover) {
            zoomTo(3, getMouseInfo());
          }
        }
      },
    [setDim, zoomTo, getMouseInfo]
  );

  const onKeyUp = React.useCallback(
    (e) => {
      // Ignore text in Input or Textarea
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      // Zoom out on release
      if (e.key === " " && getMouseInfo().hover) {
        zoomTo(1 / 3, getMouseInfo());
      }
    },
    [getMouseInfo, zoomTo]
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
    <Gesture onPan={onPan} onZoom={onZoom} onDrag={onDrag}>
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
