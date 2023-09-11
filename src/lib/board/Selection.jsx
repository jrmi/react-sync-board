import React from "react";
import { css } from "goober";
import { useDebouncedCallback } from "@react-hookz/web/esm/useDebouncedCallback";

import { getItemsBoundingBox } from "@/utils";
import { useSyncedStore } from "@/board/store/synced";
import useMainStore from "./store/main";

const defaultZoneStyle = css({
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 210,
  backgroundColor: "hsla(0, 40%, 50%, 0%)",
  border: "2px dashed hsl(20, 55%, 40%)",
  pointerEvents: "none",
});

/**
 * Show a bounding box around all selected items.
 */
const BoundingBox = () => {
  const [
    selection,
    getSelection,
    selectionBox,
    setSelectionBox,
    getConfiguration,
    { translateX, translateY, scale },
  ] = useMainStore((state) => [
    state.selection,
    state.getSelection,
    state.selectionBox,
    state.setSelectionBox,
    state.getConfiguration,
    {
      translateX: state.boardState.translateX,
      translateY: state.boardState.translateY,
      scale: state.boardState.scale,
    },
  ]);

  const [items] = useSyncedStore((state) => [state.items]);

  // Update selection bounding box
  const updateBox = React.useCallback(() => {
    const currentSelectedItems = getSelection();
    const { boardWrapperRect, boardWrapper } = getConfiguration();

    if (currentSelectedItems.length === 0) {
      setSelectionBox(null);
      return;
    }

    const boundingBox = getItemsBoundingBox(currentSelectedItems, boardWrapper);

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
  const updateBoxDelay = useDebouncedCallback(updateBox, [updateBox], 300);

  React.useEffect(() => {
    // Update selected elements bounding box
    updateBox();
    updateBoxDelay(); // Delay to update after board item animation like tap/untap.
  }, [
    selection,
    items,
    translateX,
    translateY,
    scale,
    updateBox,
    updateBoxDelay,
  ]);

  if (!selectionBox || selection.length < 2) return null;

  return (
    <div
      style={{
        transform: `translate(${selectionBox.left}px, ${selectionBox.top}px)`,
        height: `${selectionBox.height}px`,
        width: `${selectionBox.width}px`,
      }}
      className={`selection ${defaultZoneStyle}`}
    />
  );
};

const Selection = () => {
  const [movingItems] = useMainStore((state) => [state.boardState.movingItems]);

  if (movingItems) {
    return null;
  }

  return <BoundingBox />;
};

export default Selection;
