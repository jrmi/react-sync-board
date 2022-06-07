import React from "react";
import { useSetRecoilState, useRecoilCallback } from "recoil";

import {
  BoardStateAtom,
  SelectedItemsAtom,
  BoardTransformAtom,
  BoardConfigAtom,
} from "./atoms";
import { useItemActions } from "./Items";
import { getIdFromElem } from "../utils";

import Gesture from "./Gesture";

const ActionPane = ({ children, moveFirst = false }) => {
  const { moveItems, placeItems, findElementUnderPointer } = useItemActions();

  const setSelectedItems = useSetRecoilState(SelectedItemsAtom);
  const setBoardState = useSetRecoilState(BoardStateAtom);

  const actionRef = React.useRef({});

  // Use ref because pointer events are faster than react state management
  const selectedItemRef = React.useRef({
    items: [],
  });

  const onDragStart = useRecoilCallback(
    ({ snapshot }) =>
      async (event) => {
        const { ctrlKey, metaKey, event: originalEvent } = event;
        const foundElement = await findElementUnderPointer(event);

        if (foundElement) {
          originalEvent.stopPropagation();

          const selectedItems = await snapshot.getPromise(SelectedItemsAtom);

          selectedItemRef.current.items = selectedItems;

          const itemId = getIdFromElem(foundElement);

          if (!selectedItems.includes(itemId)) {
            if (ctrlKey || metaKey) {
              selectedItemRef.current.items = [...selectedItems, itemId];
              setSelectedItems((prev) => [...prev, itemId]);
            } else {
              selectedItemRef.current.items = [itemId];
              setSelectedItems([itemId]);
            }
          }

          Object.assign(actionRef.current, {
            moving: true,
            remainX: 0,
            remainY: 0,
          });
        }
      },
    [findElementUnderPointer, setSelectedItems]
  );

  const onDrag = useRecoilCallback(
    ({ snapshot }) =>
      async ({ deltaX, deltaY }) => {
        if (actionRef.current.moving) {
          const { scale } = await snapshot.getPromise(BoardTransformAtom);
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

          setBoardState((prev) =>
            !prev.movingItems ? { ...prev, movingItems: true } : prev
          );
        }
      },
    [moveItems, setBoardState]
  );

  const onDragEnd = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        if (actionRef.current.moving) {
          const { gridSize: boardGridSize = 1 } = await snapshot.getPromise(
            BoardConfigAtom
          );
          const gridSize = boardGridSize || 1; // avoid 0 grid size

          actionRef.current = { moving: false };
          placeItems(selectedItemRef.current.items, {
            type: "grid",
            size: gridSize,
          });
          setBoardState((prev) => ({ ...prev, movingItems: false }));
        }
      },
    [placeItems, setBoardState]
  );

  const onKeyDown = useRecoilCallback(
    ({ snapshot }) =>
      async (e) => {
        // Block shortcut if we are typing in a textarea or input
        if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

        const selectedItems = await snapshot.getPromise(SelectedItemsAtom);

        if (selectedItems.length) {
          const { gridSize: boardGridSize = 1 } = await snapshot.getPromise(
            BoardConfigAtom
          );
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
    [moveItems, placeItems]
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
