import React from "react";
import { useDebouncedCallback } from "@react-hookz/web/esm/useDebouncedCallback";

import { useSyncedStore } from "@/board/store/synced";
import {
  distance,
  getItemElem,
  intersectSegmentCircle,
  transformFrom,
  transformTo,
} from "@/utils";
import useMainStore from "./store/main";

const TOLERANCE = 100;
const MIN_SIZE = 1000;
const SCALE_TOLERANCE = 0.8;

/**
 * Return new board positions fixed to fit inside the board and not too far from the
 * item extent.
 */
const translateBoundaries = ({
  x,
  y,
  scale,
  rotate,
  itemExtent,
  boardWrapperRect,
  boardSize,
}) => {
  let [newX, newY] = [x, y];

  const screenCenter = transformFrom(
    [boardWrapperRect.width / 2, boardWrapperRect.height / 2],
    { translateX: newX, translateY: newY, scale, rotate }
  );

  const extentPos = {
    x: itemExtent.x + boardSize / 2,
    y: itemExtent.y + boardSize / 2,
  };

  const boardCenter = {
    x: boardSize / 2,
    y: boardSize / 2,
  };

  const distToExtent = distance(screenCenter, [extentPos.x, extentPos.y]);

  // Limit moves to extent
  const minDim = Math.min(boardWrapperRect.width, boardWrapperRect.height);
  const maxDistToExtent =
    itemExtent.radius + minDim / 2 / scale - TOLERANCE / scale;

  if (distToExtent > maxDistToExtent) {
    const inter = intersectSegmentCircle(
      { x: screenCenter[0], y: screenCenter[1] },
      extentPos,
      extentPos,
      maxDistToExtent - 1 / scale
    )[0];

    const [translateX, translateY] = transformTo([-inter.x, -inter.y], {
      translateX: boardWrapperRect.width / 2,
      translateY: boardWrapperRect.height / 2,
      scale,
      rotate,
    });

    newX = translateX;
    newY = translateY;
  }

  // Limit move to board limit
  const distToCenter = distance(screenCenter, [boardCenter.x, boardCenter.y]);
  const maxDistToCenter =
    boardSize / 2 -
    distance([0, 0], [boardWrapperRect.width, boardWrapperRect.height]) / scale;

  if (distToCenter > maxDistToCenter) {
    const inter = intersectSegmentCircle(
      { x: screenCenter[0], y: screenCenter[1] },
      boardCenter,
      boardCenter,
      maxDistToCenter - 1 / scale
    )[0];

    if (inter) {
      const [translateX, translateY] = transformTo([-inter.x, -inter.y], {
        translateX: boardWrapperRect.width / 2,
        translateY: boardWrapperRect.height / 2,
        scale,
        rotate,
      });

      newX = translateX;
      newY = translateY;
    }
  }

  return [newX, newY];
};

const useDim = () => {
  const [
    getBoardState,
    updateBoardState,
    itemExtentGlobal,
    getConfiguration,
    updateConfiguration,
  ] = useMainStore((state) => [
    state.getBoardState,
    state.updateBoardState,
    state.config.itemExtent,
    state.getConfiguration,
    state.updateConfiguration,
  ]);
  const scaleBoundariesRef = React.useRef([0.15, 5]);

  const [getItemList] = useSyncedStore((state) => [state.getItemList]);

  const getDim = React.useCallback(() => {
    const { translateX, translateY, scale, rotate } = getBoardState();
    return { translateX, translateY, scale, rotate };
  }, [getBoardState]);

  const fromWrapperToBoard = React.useCallback(
    (x, y) => {
      return transformFrom([x, y], getBoardState());
    },
    [getBoardState]
  );

  const fromBoardToWrapper = React.useCallback(
    (x, y) => {
      return transformTo([x, y], getBoardState());
    },
    [getBoardState]
  );

  const vectorFromWrapperToBoard = React.useCallback(
    (x, y) => {
      const { scale, rotate } = getBoardState();

      return transformFrom([x, y], {
        translateX: 0,
        translateY: 0,
        rotate,
        scale,
      });
    },
    [getBoardState]
  );

  /**
   * Clamp scale to boundaries limits.
   */
  const clampScale = React.useCallback((scale) => {
    if (scale > scaleBoundariesRef.current[1]) {
      return scaleBoundariesRef.current[1];
    }

    if (scale < scaleBoundariesRef.current[0]) {
      return scaleBoundariesRef.current[0];
    }
    return scale;
  }, []);

  /**
   * Set board position safely by avoiding to go out of the dedicated space.
   */
  const setDimSafe = React.useCallback(
    (fn) => {
      const { itemExtent, boardWrapperRect, boardSize } = getConfiguration();

      const prev = getBoardState();

      const {
        translateX,
        translateY,
        scale,
        rotate: newRotate,
      } = {
        ...prev,
        ...fn(prev),
      };

      const newScale = clampScale(scale);

      let [newX, newY] = [translateX, translateY];

      if (translateX !== prev.translateX || translateY !== prev.translateY) {
        [newX, newY] = translateBoundaries({
          x: translateX,
          y: translateY,
          scale: newScale,
          rotate: newRotate,
          itemExtent,
          boardWrapperRect,
          boardSize,
        });
      }

      updateBoardState({
        translateX: newX,
        translateY: newY,
        scale: newScale,
        rotate: newRotate,
      });
    },
    [clampScale, getBoardState, getConfiguration, updateBoardState]
  );

  /**
   * Move the board to the given coordinates.
   */
  const moveBoard = React.useCallback(
    (newTranslatOrFn) => {
      let translateFn = (prev) => ({ ...prev, ...newTranslatOrFn });
      if (typeof newTranslatOrFn === "function") {
        translateFn = newTranslatOrFn;
      }

      setDimSafe((prev) => ({
        ...prev,
        ...translateFn({
          translateX: prev.translateX,
          translateY: prev.translateY,
        }),
      }));
    },
    [setDimSafe]
  );

  /**
   * Zoom to factor centered on the given zoomCenter coordinates.
   *
   * zoomCenter is screen coordinates.
   */
  const zoomToCenter = React.useCallback(
    ({ to, factor }) => {
      const { boardWrapperRect } = getConfiguration();

      let center = to;

      if (!center) {
        center = {
          x: boardWrapperRect.left + boardWrapperRect.width / 2,
          y: boardWrapperRect.top + boardWrapperRect.height / 2,
        };
      }

      const prev = getBoardState();

      const newScale = clampScale(prev.scale * factor);

      const centerX = center.x - boardWrapperRect.left;
      const centerY = center.y - boardWrapperRect.top;

      const newTx =
        centerX - ((centerX - prev.translateX) * newScale) / prev.scale;
      const newTy =
        centerY - ((centerY - prev.translateY) * newScale) / prev.scale;

      setDimSafe((prev) => ({
        ...prev,
        translateX: newTx,
        translateY: newTy,
        scale: newScale,
      }));
    },
    [clampScale, getBoardState, getConfiguration, setDimSafe]
  );

  /**
   * Zoom to the given extent. The full extent will be included in the viewport.
   */
  const zoomToExtent = React.useCallback(
    ({ x, y, radius }) => {
      const { rotate } = getBoardState();
      const { boardWrapperRect, boardSize } = getConfiguration();

      const scaleX = boardWrapperRect.width / (radius * 2);
      const scaleY = boardWrapperRect.height / (radius * 2);

      // The scale that fits in all dimensions with a border around
      const scale = clampScale(Math.min(scaleX, scaleY) * SCALE_TOLERANCE);

      // We apply the board transformations
      const [translateX, translateY] = transformTo(
        [-boardSize / 2 - x, -boardSize / 2 - y],
        {
          translateX: boardWrapperRect.width / 2,
          translateY: boardWrapperRect.height / 2,
          scale,
          rotate,
        }
      );

      setDimSafe((prev) => ({ ...prev, translateX, translateY, scale }));
    },
    [clampScale, getBoardState, getConfiguration, setDimSafe]
  );

  /**
   * Get the board coordinates pointed by the center of the screen.
   */
  const getCenterCoordinates = React.useCallback(() => {
    const { boardWrapperRect, boardSize } = getConfiguration();
    const [x, y] = fromWrapperToBoard(
      boardWrapperRect.width / 2,
      boardWrapperRect.height / 2
    );
    return {
      x: x - boardSize / 2,
      y: y - boardSize / 2,
    };
  }, [fromWrapperToBoard, getConfiguration]);

  /**
   * Update the extent of all board items.
   */
  const updateItemExtent = React.useCallback(() => {
    // Update item extent
    const items = getItemList();
    const { boardWrapper, boardSize } = getConfiguration();

    const newRes = items.reduce(
      (boundingBox, item) => {
        const elem = getItemElem(boardWrapper, item.id);

        boundingBox.left = Math.min(item.x, boundingBox.left);
        boundingBox.top = Math.min(item.y, boundingBox.top);

        boundingBox.right = Math.max(
          item.x + elem.offsetWidth,
          boundingBox.right
        );
        boundingBox.bottom = Math.max(
          item.y + elem.offsetHeight,
          boundingBox.bottom
        );

        return boundingBox;
      },
      {
        left: boardSize / 2,
        top: boardSize / 2,
        right: -boardSize / 2,
        bottom: -boardSize / 2,
      }
    );

    const final = {
      x: (newRes.right + newRes.left) / 2,
      y: (newRes.bottom + newRes.top) / 2,
    };

    final.radius = Math.max(
      distance([final.x, final.y], [newRes.left, newRes.top]),
      MIN_SIZE
    );

    updateConfiguration({ itemExtent: final });
  }, [getConfiguration, getItemList, updateConfiguration]);

  /**
   * Rotate the board to the given angle in degrees. If a function is given, it is
   * called with the previous angle as parameter and should return a new angle.
   */
  const rotateBoard = React.useCallback(
    (newAngleOrFn) => {
      let applyRotate = () => newAngleOrFn;
      if (typeof newAngleOrFn === "function") {
        applyRotate = newAngleOrFn;
      }

      setDimSafe((prev) => ({ ...prev, rotate: applyRotate(prev.rotate) }));

      // Zoom to new extent to not being lost
      updateItemExtent();
      zoomToExtent(itemExtentGlobal);
    },
    [itemExtentGlobal, setDimSafe, updateItemExtent, zoomToExtent]
  );

  const debouncedUpdateItemExtent = useDebouncedCallback(
    () => updateItemExtent(),
    [updateItemExtent],
    200
  );

  return {
    setDim: setDimSafe,
    rotateBoard,
    moveBoard,
    getDim,
    zoomTo: zoomToCenter,
    zoomToCenter,
    zoomToExtent,
    getCenter: getCenterCoordinates,
    updateItemExtent: debouncedUpdateItemExtent,
    vectorFromWrapperToBoard,
    fromWrapperToBoard,
    fromBoardToWrapper,
  };
};

export default useDim;
