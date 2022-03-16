import { useDebouncedCallback } from "@react-hookz/web/esm";
import React from "react";

import { useSetRecoilState, useRecoilCallback, useRecoilValue } from "recoil";
import { ItemListAtom } from ".";
import { getItemBoundingBox } from "../utils";
import { BoardTransformAtom, ConfigurationAtom } from "./atoms";

const TOLERANCE = 100;
const MIN_SIZE = 1000;

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
  const { itemExtent: itemExtentGlobal } = useRecoilValue(ConfigurationAtom);

  const getDim = useRecoilCallback(
    ({ snapshot }) =>
      () =>
        snapshot.getPromise(BoardTransformAtom),
    []
  );

  const setDimSafe = useRecoilCallback(
    ({ snapshot }) =>
      async (fn) => {
        const { itemExtent, boardWrapperRect, boardSize } =
          await snapshot.getPromise(ConfigurationAtom);
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

          if (
            translateX !== prev.translateX ||
            translateY !== prev.translateY
          ) {
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
    [setDim]
  );

  const zoomTo = useRecoilCallback(
    ({ snapshot }) =>
      async (factor, zoomCenter) => {
        const { itemExtent, boardWrapperRect, boardSize } =
          await snapshot.getPromise(ConfigurationAtom);

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
    [setDim]
  );

  const updateScaleBoundaries = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const {
          itemExtent: { width, height },
          boardWrapperRect,
        } = await snapshot.getPromise(ConfigurationAtom);

        const scaleX = boardWrapperRect.width / width;
        const scaleY = boardWrapperRect.height / height;

        const newScale = Math.min(scaleX, scaleY);

        scaleBoundariesRef.current = [
          Math.max(newScale * 0.5, 0.05),
          Math.max(newScale * 10, 10),
        ];
      },
    []
  );

  const getCenterCoordinates = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const { boardWrapperRect, boardSize } = await snapshot.getPromise(
          ConfigurationAtom
        );
        const { translateX, translateY, scale } = await snapshot.getPromise(
          BoardTransformAtom
        );
        return {
          x: (boardWrapperRect.width / 2 - translateX) / scale - boardSize / 2,
          y: (boardWrapperRect.height / 2 - translateY) / scale - boardSize / 2,
        };
      },
    []
  );

  const updateItemExtent = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        // Update item extent
        const itemIds = await snapshot.getPromise(ItemListAtom);
        const { boardWrapperRect, boardWrapper, boardSize } =
          await snapshot.getPromise(ConfigurationAtom);
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

        set(ConfigurationAtom, (prev) => ({
          ...prev,
          itemExtent: relativeExtent,
        }));
      },
    []
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
    zoomTo,
    getCenter: getCenterCoordinates,
    updateItemExtent: debouncedUpdateItemExtent,
  };
};

export default useDim;
