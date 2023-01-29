import React from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";
import { useDebouncedCallback } from "@react-hookz/web/esm";

import { BoardTransformAtom, BoardStateAtom } from "./atoms";
import { getItemBoundingBox } from "@/utils";
import { useSyncedItems } from "./store/items";
import useSelection from "./store/selection";
import useMainStore from "./store/main";

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
  const [selection, getSelection, selectionBox, setSelectionBox] = useSelection(
    (state) => [
      state.selection,
      state.getSelection,
      state.selectionBox,
      state.setSelectionBox,
    ]
  );
  const getConfiguration = useMainStore((state) => state.getConfiguration);
  const boardTransform = useRecoilValue(BoardTransformAtom);
  const items = useSyncedItems((state) => state.items);

  // Update selection bounding box
  const updateBox = React.useCallback(() => {
    const currentSelectedItems = getSelection();
    const { boardWrapperRect, boardWrapper } = getConfiguration();

    if (currentSelectedItems.length === 0) {
      setSelectionBox(null);
      return;
    }

    const boundingBox = getItemBoundingBox(currentSelectedItems, boardWrapper);

    if (!boundingBox) {
      setSelectionBox(null);
      return;
    }

    const { left, top, width, height } = boundingBox;

    const newBB = {
      left: left - boardWrapperRect.left,
      top: top - boardWrapperRect.top,
      height,
      width,
    };

    setSelectionBox(newBB);
  }, [getConfiguration, getSelection, setSelectionBox]);

  // Debounced version of update box
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateBoxDelay = useDebouncedCallback(updateBox, [updateBox], 300);

  React.useEffect(() => {
    // Update selected elements bounding box
    updateBox();
    updateBoxDelay(); // Delay to update after board item animation like tap/untap.
  }, [selection, items, boardTransform, updateBox, updateBoxDelay]);

  if (!selectionBox || selection.length < 2) return null;

  return (
    <div
      style={{
        ...defaultZoneStyle,
        transform: `translate(${selectionBox.left}px, ${selectionBox.top}px)`,
        height: `${selectionBox.height}px`,
        width: `${selectionBox.width}px`,
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
