import React from "react";
import { useDebouncedCallback } from "@react-hookz/web/esm";

import { useSetRecoilState, useRecoilCallback, useRecoilValue } from "recoil";
//import { ItemListAtom } from ".";

import { useSyncedItems } from "@/board/store/items";
import { getItemBoundingBox } from "@/utils";
import { BoardTransformAtom } from "./atoms";
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
  const setDim = useSetRecoilState(BoardTransformAtom);
  const scaleBoundariesRef = React.useRef([0.1, 8]);
  const [itemExtentGlobal, getConfiguration, updateConfiguration] =
    useMainStore((state) => [
      state.config.itemExtent,
      state.getConfiguration,
      state.updateConfiguration,
    ]);
  const getItemIds = useSyncedItems((state) => state.getItemIds);

  const getDim = useRecoilCallback(
    ({ snapshot }) =>
      () =>
        snapshot.getPromise(BoardTransformAtom),
    []
  );

  const setDimSafe = React.useCallback(
    (fn) => {
      const { itemExtent, boardWrapperRect, boardSize } = getConfiguration();
      setDim((prev) => {
        const { translateX, translateY, scale } = { ...prev, ...fn(prev) };
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

        return {
          ...prev,
          translateX: newX,
          translateY: newY,
          scale: newScale,
        };
      });
    },
    [getConfiguration, setDim]
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

      setDim((prev) => {
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

        return {
          ...prev,
          scale: newScale,
          translateX: newX,
          translateY: newY,
        };
      });
    },
    [getConfiguration, setDim]
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

      setDim((prev) => ({
        ...prev,
        translateX: centerX,
        translateY: centerY,
        scale: scaleWithTolerance,
      }));
    },
    [getConfiguration, setDim]
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

  const getCenterCoordinates = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const { boardWrapperRect, boardSize } = getConfiguration();
        const { translateX, translateY, scale } = await snapshot.getPromise(
          BoardTransformAtom
        );
        return {
          x: (boardWrapperRect.width / 2 - translateX) / scale - boardSize / 2,
          y: (boardWrapperRect.height / 2 - translateY) / scale - boardSize / 2,
        };
      },
    [getConfiguration]
  );

  const updateItemExtent = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        // Update item extent
        const itemIds = getItemIds();
        const { boardWrapperRect, boardWrapper, boardSize } =
          getConfiguration();
        const { scale, translateX, translateY } = await snapshot.getPromise(
          BoardTransformAtom
        );

        const { left, top, width, height } = getItemBoundingBox(
          itemIds,
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
      },
    [getConfiguration, getItemIds, updateConfiguration]
  );

  const debouncedUpdateItemExtent = useDebouncedCallback(
    updateItemExtent,
    [],
    300
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
