import React from "react";
import { useRecoilValue, useRecoilCallback, useRecoilState } from "recoil";
import { useDebouncedCallback } from "@react-hookz/web/esm";

import {
  SelectedItemsAtom,
  BoardTransformAtom,
  BoardStateAtom,
  ItemMapAtom,
  ConfigurationAtom,
  SelectionBoxAtom,
} from "./atoms";
import { getItemBoundingBox } from "../utils";

const defaultZoneStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 210,
  backgroundColor: "hsla(0, 40%, 50%, 0%)",
  border: "2px dashed hsl(20, 55%, 40%)",
  pointerEvents: "none",
};

const BoundingBox = () => {
  const selectedItems = useRecoilValue(SelectedItemsAtom);
  const [boundingBoxLast, setBoundingBoxLast] =
    useRecoilState(SelectionBoxAtom);
  const boardTransform = useRecoilValue(BoardTransformAtom);
  const itemMap = useRecoilValue(ItemMapAtom);

  // Update selection bounding box
  const updateBox = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const currentSelectedItems = await snapshot.getPromise(
          SelectedItemsAtom
        );
        const { boardWrapperRect, boardWrapper } = await snapshot.getPromise(
          ConfigurationAtom
        );

        if (currentSelectedItems.length === 0) {
          setBoundingBoxLast(null);
          return;
        }

        const boundingBox = getItemBoundingBox(
          currentSelectedItems,
          boardWrapper
        );

        if (!boundingBox) {
          setBoundingBoxLast(null);
          return;
        }

        const { left, top, width, height } = boundingBox;

        const newBB = {
          left: left - boardWrapperRect.left,
          top: top - boardWrapperRect.top,
          height,
          width,
        };

        setBoundingBoxLast((prevBB) => {
          if (
            !prevBB ||
            prevBB.top !== newBB.top ||
            prevBB.left !== newBB.left ||
            prevBB.width !== newBB.width ||
            prevBB.height !== newBB.height
          ) {
            return newBB;
          }
          return prevBB;
        });
      },
    [setBoundingBoxLast]
  );

  // Debounced version of update box
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateBoxDelay = useDebouncedCallback(updateBox, [updateBox], 300);

  React.useEffect(() => {
    // Update selected elements bounding box
    updateBox();
    updateBoxDelay(); // Delay to update after board item animation like tap/untap.
  }, [selectedItems, itemMap, boardTransform, updateBox, updateBoxDelay]);

  if (!boundingBoxLast || selectedItems.length < 2) return null;

  return (
    <div
      style={{
        ...defaultZoneStyle,
        transform: `translate(${boundingBoxLast.left}px, ${boundingBoxLast.top}px)`,
        height: `${boundingBoxLast.height}px`,
        width: `${boundingBoxLast.width}px`,
      }}
      className="selection"
    />
  );
};

const Selection = () => {
  const boardState = useRecoilValue(BoardStateAtom);

  if (boardState.movingItems) {
    return null;
  }

  return <BoundingBox />;
};

export default Selection;
