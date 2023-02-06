import React from "react";
import { useDebouncedCallback } from "@react-hookz/web/esm/useDebouncedCallback";

import { useSyncedStore } from "@/board/store/synced";
import { getItemBoundingBox } from "@/utils";
import useMainStore from "./store/main";

const TOLERANCE = 100;
const MIN_SIZE = 1000;
const SCALE_TOLERANCE = 0.8;

const translateBoundaries = ({
  x,
  y,
  scale,
  itemExtent: { right, left, top, bottom },
  boardWrapperRect,
  boardSize,
}) => {
  const boundaries = {
    left: -right * scale + TOLERANCE * scale,
    right: boardWrapperRect.width - left * scale - TOLERANCE * scale,
    top: -bottom * scale + TOLERANCE * scale,
    bottom: boardWrapperRect.height - top * scale - TOLERANCE * scale,
    maxRight: boardWrapperRect.width - boardSize * scale,
    maxLeft: boardWrapperRect.height - boardSize * scale,
  };

  const newX = Math.min(
    Math.max(x, boundaries.left, boundaries.maxRight),
    boundaries.right,
    0
  );
  const newY = Math.min(
    Math.max(y, boundaries.top, boundaries.maxLeft),
    boundaries.bottom,
    0
  );

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
  const scaleBoundariesRef = React.useRef([0.1, 8]);

  const [getItemList] = useSyncedStore((state) => [state.getItemList]);

  const getDim = React.useCallback(() => {
    const { translateX, translateY, scale } = getBoardState();
    return { translateX, translateY, scale };
  }, [getBoardState]);

  const setDimSafe = React.useCallback(
    (fn) => {
      const { itemExtent, boardWrapperRect, boardSize } = getConfiguration();

      const prev = getBoardState();

      const { translateX, translateY, scale } = {
        ...prev,
        ...fn(prev),
      };

      let newScale = scale;

      if (scale !== prev.scale) {
        if (newScale > scaleBoundariesRef.current[1]) {
          [, newScale] = scaleBoundariesRef.current;
        }

        if (newScale < scaleBoundariesRef.current[0]) {
          [newScale] = scaleBoundariesRef.current;
        }
      }

      let [newX, newY] = [translateX, translateY];

      if (translateX !== prev.translateX || translateY !== prev.translateY) {
        [newX, newY] = translateBoundaries({
          x: translateX,
          y: translateY,
          scale: newScale,
          itemExtent,
          boardWrapperRect,
          boardSize,
        });
      }

      updateBoardState({
        translateX: newX,
        translateY: newY,
        scale: newScale,
      });
    },
    [getBoardState, getConfiguration, updateBoardState]
  );

  const zoomToCenter = React.useCallback(
    (factor, zoomCenter) => {
      const { itemExtent, boardWrapperRect, boardSize } = getConfiguration();

      let center = zoomCenter;

      if (!center) {
        center = {
          x: boardWrapperRect.width / 2,
          y: boardWrapperRect.height / 2,
        };
      }

      const prev = getBoardState();

      let newScale = prev.scale * factor;

      if (newScale > scaleBoundariesRef.current[1]) {
        [, newScale] = scaleBoundariesRef.current;
      }

      if (newScale < scaleBoundariesRef.current[0]) {
        [newScale] = scaleBoundariesRef.current;
      }

      const centerX = center.x - boardWrapperRect.left;
      const centerY = center.y - boardWrapperRect.top;

      const newTx =
        centerX - ((centerX - prev.translateX) * newScale) / prev.scale;
      const newTy =
        centerY - ((centerY - prev.translateY) * newScale) / prev.scale;

      const [newX, newY] = translateBoundaries({
        x: newTx,
        y: newTy,
        scale: newScale,
        itemExtent,
        boardWrapperRect,
        boardSize,
      });

      updateBoardState({
        scale: newScale,
        translateX: newX,
        translateY: newY,
      });
    },
    [getBoardState, getConfiguration, updateBoardState]
  );

  const zoomToExtent = React.useCallback(
    ({ left, top, width, height }) => {
      const { boardWrapperRect } = getConfiguration();

      const scaleX = boardWrapperRect.width / width;
      const scaleY = boardWrapperRect.height / height;

      const newScale = Math.min(scaleX, scaleY);

      const scaleWithTolerance = newScale * SCALE_TOLERANCE;

      const centerX =
        boardWrapperRect.width / 2 - (left + width / 2) * scaleWithTolerance;
      const centerY =
        boardWrapperRect.height / 2 - (top + height / 2) * scaleWithTolerance;

      updateBoardState({
        translateX: centerX,
        translateY: centerY,
        scale: scaleWithTolerance,
      });
    },
    [getConfiguration, updateBoardState]
  );

  const updateScaleBoundaries = React.useCallback(async () => {
    const {
      itemExtent: { width, height },
      boardWrapperRect,
    } = getConfiguration();

    const scaleX = boardWrapperRect.width / width;
    const scaleY = boardWrapperRect.height / height;

    const newScale = Math.min(scaleX, scaleY);

    scaleBoundariesRef.current = [
      Math.max(newScale * 0.5, 0.05),
      Math.max(newScale * 10, 10),
    ];
  }, [getConfiguration]);

  const getCenterCoordinates = React.useCallback(() => {
    const { boardWrapperRect, boardSize } = getConfiguration();
    const { translateX, translateY, scale } = getBoardState();
    return {
      x: (boardWrapperRect.width / 2 - translateX) / scale - boardSize / 2,
      y: (boardWrapperRect.height / 2 - translateY) / scale - boardSize / 2,
    };
  }, [getBoardState, getConfiguration]);

  const updateItemExtent = React.useCallback(() => {
    // Update item extent
    const items = getItemList();
    const { boardWrapperRect, boardWrapper, boardSize } = getConfiguration();
    const { scale, translateX, translateY } = getBoardState();

    const { left, top, width, height } = getItemBoundingBox(
      items.map(({ id }) => id),
      boardWrapper
    ) || {
      left: (boardSize / 2) * scale + boardWrapperRect.left + translateX,
      top: (boardSize / 2) * scale + boardWrapperRect.top + translateY,
      width: 0,
      height: 0,
    };

    const relativeExtent = {
      left: (left - boardWrapperRect.left - translateX) / scale,
      top: (top - boardWrapperRect.top - translateY) / scale,

      width: width / scale,
      height: height / scale,
    };

    relativeExtent.right = relativeExtent.left + relativeExtent.width;
    relativeExtent.bottom = relativeExtent.top + relativeExtent.height;

    // Resize to have a minimal size
    if (relativeExtent.width < MIN_SIZE) {
      const delta = (MIN_SIZE - relativeExtent.width) / 2;
      relativeExtent.left -= delta;
      relativeExtent.right += delta;
      relativeExtent.width = MIN_SIZE;
    }
    if (relativeExtent.height < MIN_SIZE) {
      const delta = (MIN_SIZE - relativeExtent.height) / 2;
      relativeExtent.top -= delta;
      relativeExtent.bottom += delta;
      relativeExtent.height = MIN_SIZE;
    }

    updateConfiguration({ itemExtent: relativeExtent });
  }, [getBoardState, getConfiguration, getItemList, updateConfiguration]);

  const debouncedUpdateItemExtent = useDebouncedCallback(
    () => updateItemExtent(),
    [updateItemExtent],
    200
  );

  React.useEffect(() => {
    if (itemExtentGlobal.left) {
      updateScaleBoundaries();
    }
  }, [updateScaleBoundaries, itemExtentGlobal]);

  return {
    setDim: setDimSafe,
    getDim,
    zoomTo: zoomToCenter,
    zoomToCenter,
    zoomToExtent,
    getCenter: getCenterCoordinates,
    updateItemExtent: debouncedUpdateItemExtent,
  };
};

export default useDim;
