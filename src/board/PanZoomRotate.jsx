import React from "react";

import {
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
  useRecoilCallback,
} from "recoil";
import styled from "styled-components";
import debounce from "lodash.debounce";
import {
  BoardConfigAtom,
  BoardStateAtom,
  PanZoomRotateAtom,
  SelectedItemsAtom,
} from "./atoms";
import { insideClass, getParent } from "../utils";

import usePrevious from "../hooks/usePrevious";

import Gesture from "./Gesture";
import usePositionNavigator from "./usePositionNavigator";

const TOLERANCE = 100;

const Pane = styled.div.attrs(({ translateX, translateY, scale, rotate }) => ({
  style: {
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
  },
  className: "board-pane",
}))`
  transform-origin: top left;
  display: inline-block;
`;

const PanZoomRotate = ({ children, moveFirst }) => {
  const wrappedRef = React.useRef(null);
  const boardRef = React.useRef(null);
  const [scaleBoundaries, setScaleBoundaries] = React.useState([0.1, 8]);
  const [dim, setDim] = useRecoilState(PanZoomRotateAtom);
  const config = useRecoilValue(BoardConfigAtom);
  const setBoardState = useSetRecoilState(BoardStateAtom);
  const prevDim = usePrevious(dim);

  // Hooks to save/restore position
  usePositionNavigator();

  const [scale, setScale] = React.useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  React.useEffect(() => {
    boardRef.current = getParent(wrappedRef.current, (elt) =>
      elt.classList.contains("sync-board")
    );
  }, []);

  // React on scale change
  React.useLayoutEffect(() => {
    setDim((prevDimension) => {
      const { top, left } = wrappedRef.current.getBoundingClientRect();

      const displayX = scale.x - left;
      const deltaX = displayX - (displayX / prevDimension.scale) * scale.scale;
      const displayY = scale.y - top;
      const deltaY = displayY - (displayY / prevDimension.scale) * scale.scale;

      return {
        ...prevDimension,
        scale: scale.scale,
        translateX: prevDimension.translateX + deltaX,
        translateY: prevDimension.translateY + deltaY,
      };
    });
  }, [scale, setDim]);

  // Center board on game loading
  React.useEffect(() => {
    const {
      width: innerWidth,
      height: innerHeight,
    } = boardRef.current.getBoundingClientRect();

    const minSize = Math.min(innerHeight, innerWidth);

    const newScale = (minSize / config.size) * 0.8;

    setScaleBoundaries([newScale * 0.8, Math.max(newScale * 30, 8)]);

    setDim((prev) => ({
      ...prev,
      scale: newScale,
      translateX: innerWidth / 2 - (config.size / 2) * newScale,
      translateY: innerHeight / 2 - (config.size / 2) * newScale,
    }));

    setScale((prev) => ({ ...prev, scale: newScale, x: 0, y: 0 }));
    // We only want to do it at component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.size]);

  // Keep board inside viewport
  React.useEffect(() => {
    const { width, height } = wrappedRef.current.getBoundingClientRect();

    const {
      width: innerWidth,
      height: innerHeight,
    } = boardRef.current.getBoundingClientRect();

    const newDim = {};

    if (dim.translateX > innerWidth - TOLERANCE) {
      newDim.translateX = innerWidth - TOLERANCE;
    }
    if (dim.translateX + width < TOLERANCE) {
      newDim.translateX = TOLERANCE - width;
    }
    if (dim.translateY > innerHeight - TOLERANCE) {
      newDim.translateY = innerHeight - TOLERANCE;
    }
    if (dim.translateY + height < TOLERANCE) {
      newDim.translateY = TOLERANCE - height;
    }
    if (Object.keys(newDim).length > 0) {
      setDim((prevDimension) => ({
        ...prevDimension,
        ...newDim,
      }));
    }
  }, [dim.translateX, dim.translateY, setDim]);

  // Debounce set center to avoid too many render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateCenter = React.useCallback(
    debounce(() => {
      const {
        width: innerWidth,
        height: innerHeight,
      } = boardRef.current.getBoundingClientRect();

      setDim((prevDimension) => ({
        ...prevDimension,
        centerX:
          (innerWidth / 2 - prevDimension.translateX) / prevDimension.scale,
        centerY:
          (innerHeight / 2 - prevDimension.translateY) / prevDimension.scale,
      }));
    }, 300),
    [setDim]
  );

  React.useEffect(() => {
    debouncedUpdateCenter();
  }, [debouncedUpdateCenter, dim.translateX, dim.translateY]);

  const zoomTo = React.useCallback(
    (factor, zoomCenter) => {
      let center = zoomCenter;
      if (!center) {
        const {
          width: innerWidth,
          height: innerHeight,
        } = boardRef.current.getBoundingClientRect();
        center = {
          x: innerWidth / 2,
          y: innerHeight / 2,
        };
      }

      setScale((prevScale) => {
        let newScale = prevScale.scale * factor;
        if (newScale > scaleBoundaries[1]) {
          [, newScale] = scaleBoundaries;
        }

        if (newScale < scaleBoundaries[0]) {
          [newScale] = scaleBoundaries;
        }

        return {
          scale: newScale,
          ...center,
        };
      });
    },
    [scaleBoundaries]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateBoardStateZoomingDelay = React.useCallback(
    debounce((newState) => {
      setBoardState(newState);
    }, 300),
    [setBoardState]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateBoardStatePanningDelay = React.useCallback(
    debounce((newState) => {
      setBoardState(newState);
    }, 200),
    [setBoardState]
  );

  // Update boardState on zoom or pan
  React.useEffect(() => {
    if (!prevDim) {
      return;
    }
    if (prevDim.scale !== dim.scale) {
      setBoardState((prev) =>
        !prev.zooming ? { ...prev, zooming: true } : prev
      );
      updateBoardStateZoomingDelay((prev) =>
        prev.zooming ? { ...prev, zooming: false } : prev
      );
    }
    if (
      prevDim.translateY !== dim.translateY ||
      prevDim.translateX !== dim.translateX
    ) {
      setBoardState((prev) =>
        !prev.panning ? { ...prev, panning: true } : prev
      );
      updateBoardStatePanningDelay((prev) =>
        prev.panning ? { ...prev, panning: false } : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dim, updateBoardStatePanningDelay, updateBoardStateZoomingDelay]);

  const onZoom = React.useCallback(
    ({ clientX, clientY, scale: newScale }) => {
      zoomTo(1 - newScale / 200, { x: clientX, y: clientY });
    },
    [zoomTo]
  );

  const onPan = React.useCallback(
    ({ deltaX, deltaY }) => {
      setDim((prevDimension) => ({
        ...prevDimension,
        translateX: prevDimension.translateX + deltaX,
        translateY: prevDimension.translateY + deltaY,
      }));
    },
    [setDim]
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
    ({ snapshot }) => async (e) => {
      // Block shortcut if we are typing in a textarea or input
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      let moveX = 0;
      let moveY = 0;
      let zoom = 1;
      switch (e.key) {
        case "ArrowLeft":
          moveX = 10;
          break;
        case "ArrowRight":
          moveX = -10;
          break;
        case "ArrowUp":
          moveY = 10;
          break;
        case "ArrowDown":
          moveY = -10;
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
      // Temporally zoom
      if (e.key === " " && !e.repeat) {
        zoomTo(3);
      }
    },
    [setDim, zoomTo]
  );

  const onKeyUp = React.useCallback(
    (e) => {
      // Zoom out on release
      if (e.key === " ") {
        zoomTo(1 / 3);
      }
    },
    [zoomTo]
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
      <Pane
        {...dim}
        ref={wrappedRef}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {children}
      </Pane>
    </Gesture>
  );
};

export default PanZoomRotate;
