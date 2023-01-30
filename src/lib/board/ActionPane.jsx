import React from "react";

import { useItemActions } from "./Items";
import { getIdFromElem } from "@/utils";

import Gesture from "./Gesture";
import useSelection from "./store/selection";
import useMainStore from "./store/main";
import { useSyncedStore } from "@/board/store/synced";

/**
 * This component handles the move of items when dragging them or with the keyboard.
 */
const ActionPane = ({ children }) => {
  const { moveItems, placeItems, findElementUnderPointer } = useItemActions();

  const [select, setSelection, getSelection] = useSelection((state) => [
    state.select,
    state.setSelection,
    state.getSelection,
  ]);
  const [getBoardState, updateBoardState] = useMainStore((state) => [
    state.getBoardState,
    state.updateBoardState,
  ]);
  const getBoardConfig = useSyncedStore((state) => state.getBoardConfig);

  const actionRef = React.useRef({});

  // Use ref because pointer events are faster than react state management
  const selectedItemRef = React.useRef({
    items: [],
  });

  const onDragStart = React.useCallback(
    async (event) => {
      const { ctrlKey, metaKey, event: originalEvent } = event;
      const foundElement = await findElementUnderPointer(event);

      if (foundElement) {
        originalEvent.stopPropagation();
        const selectedItems = getSelection();

        selectedItemRef.current.items = selectedItems;

        const itemId = getIdFromElem(foundElement);

        if (!selectedItems.includes(itemId)) {
          if (ctrlKey || metaKey) {
            selectedItemRef.current.items = [...selectedItems, itemId];
            select([itemId]);
          } else {
            selectedItemRef.current.items = [itemId];
            setSelection([itemId]);
          }
        }

        Object.assign(actionRef.current, {
          moving: true,
          remainX: 0,
          remainY: 0,
        });
      }
    },
    [findElementUnderPointer, getSelection, select, setSelection]
  );

  const onDrag = React.useCallback(
    ({ deltaX, deltaY, event: originalEvent }) => {
      if (actionRef.current.moving) {
        originalEvent.stopPropagation();
        const { scale } = getBoardState();
        const moveX = actionRef.current.remainX + deltaX / scale;
        const moveY = actionRef.current.remainY + deltaY / scale;

        moveItems(
          selectedItemRef.current.items,
          {
            x: moveX,
            y: moveY,
          },
          true
        );

        updateBoardState({ movingItems: true });
      }
    },
    [getBoardState, moveItems, updateBoardState]
  );

  const onDragEnd = React.useCallback(() => {
    if (actionRef.current.moving) {
      const { gridSize: boardGridSize = 1 } = getBoardConfig();
      const gridSize = boardGridSize || 1; // avoid 0 grid size

      actionRef.current = { moving: false };
      placeItems(selectedItemRef.current.items, {
        type: "grid",
        size: gridSize,
      });
      updateBoardState({ movingItems: false });
    }
  }, [getBoardConfig, placeItems, updateBoardState]);

  const onKeyDown = React.useCallback(
    (e) => {
      // Block shortcut if we are typing in a textarea or input
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      const selectedItems = getSelection();

      if (selectedItems.length) {
        const { gridSize: boardGridSize = 1 } = getBoardConfig();
        let moveX = 0;
        let moveY = 0;
        switch (e.key) {
          case "ArrowLeft":
            // Left pressed
            moveX = -10;
            break;
          case "ArrowRight":
            moveX = 10;
            // Right pressed
            break;
          case "ArrowUp":
            // Up pressed
            moveY = -10;
            break;
          case "ArrowDown":
            // Down pressed
            moveY = 10;
            break;
          default:
        }
        if (moveX || moveY) {
          if (e.shiftKey) {
            moveX *= 5;
            moveY *= 5;
          }
          if (e.ctrlKey || e.altKey || e.metaKey) {
            moveX /= 10;
            moveY /= 10;
          }
          moveItems(
            selectedItems,
            {
              x: moveX,
              y: moveY,
            },
            true
          );
          const gridSize = boardGridSize || 1; // avoid 0 grid size

          placeItems(selectedItems, {
            type: "grid",
            size: gridSize,
          });
          e.preventDefault();
        }
      }
    },
    [getBoardConfig, getSelection, moveItems, placeItems]
  );

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <Gesture onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd}>
      {children}
    </Gesture>
  );
};

export default ActionPane;
