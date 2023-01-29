import React from "react";
import { useThrottledCallback } from "@react-hookz/web/esm";
import { useSetRecoilState, useRecoilCallback } from "recoil";

import { insideClass, isItemInsideElement, getIdFromElem } from "@/utils";

import { BoardTransformAtom, BoardStateAtom } from "./atoms";

import Gesture from "./Gesture";
import { useItemActions } from "./Items";
import { useSyncedItems } from "./store/items";
import useSelection from "./store/selection";
import useMainStore from "./store/main";

const defaultSelectorStyle = {
  zIndex: 210,
  position: "absolute",
  backgroundColor: "hsla(0, 40%, 50%, 10%)",
  border: "2px solid hsl(0, 55%, 40%)",
};

const findSelected = (itemMap, wrapper) => {
  const selectors = wrapper.getElementsByClassName("selector");
  if (!selectors.length) {
    return [];
  }

  const selector = selectors[0];

  return Array.from(wrapper.getElementsByClassName("item"))
    .filter((elem) => {
      const id = getIdFromElem(elem);

      const item = itemMap[id];
      if (!item || item.locked) {
        return false;
      }
      return isItemInsideElement(elem, selector);
    })
    .map((elem) => getIdFromElem(elem));
};

const Selector = ({ children, moveFirst }) => {
  const [clearSelection, setSelection, select] = useSelection((state) => [
    state.clear,
    state.setSelection,
    state.select,
  ]);
  const getConfiguration = useMainStore((state) => state.getConfiguration);
  const setBoardState = useSetRecoilState(BoardStateAtom);
  const { findElementUnderPointer } = useItemActions();
  const getItems = useSyncedItems((state) => state.getItems);

  const [selector, setSelector] = React.useState({});

  const wrapperRef = React.useRef(null);
  const stateRef = React.useRef({
    moving: false,
  });

  // Reset selection on board loading
  React.useEffect(() => {
    clearSelection();
    return () => {
      clearSelection();
    };
  }, [clearSelection]);

  const updateSelected = React.useCallback(() => {
    if (stateRef.current.moving) {
      const itemMap = getItems();
      const { boardWrapper } = getConfiguration();
      const selected = findSelected(itemMap, boardWrapper);
      setSelection(selected);
    }
  }, [getConfiguration, getItems, setSelection]);

  const throttledUpdateSelected = useThrottledCallback(
    () => {
      updateSelected();
    },
    [selector, updateSelected],
    200
  );

  const onDragStart = React.useCallback(
    async (event) => {
      const foundElement = await findElementUnderPointer(event);

      if (!foundElement) {
        stateRef.current.moving = true;
        setBoardState((prev) => ({ ...prev, selecting: true }));
        wrapperRef.current.style.cursor = "crosshair";
      }
    },
    [findElementUnderPointer, setBoardState]
  );

  const onDrag = useRecoilCallback(
    ({ snapshot }) =>
      async ({ distanceY, distanceX, startX, startY }) => {
        if (stateRef.current.moving) {
          const { top, left } = wrapperRef.current.getBoundingClientRect();

          const { scale } = await snapshot.getPromise(BoardTransformAtom);

          const displayX = (startX - left) / scale;
          const displayY = (startY - top) / scale;

          const displayDistanceX = distanceX / scale;
          const displayDistanceY = distanceY / scale;

          if (displayDistanceX > 0) {
            stateRef.current.left = displayX;
            stateRef.current.width = displayDistanceX;
          } else {
            stateRef.current.left = displayX + displayDistanceX;
            stateRef.current.width = -displayDistanceX;
          }
          if (displayDistanceY > 0) {
            stateRef.current.top = displayY;
            stateRef.current.height = displayDistanceY;
          } else {
            stateRef.current.top = displayY + displayDistanceY;
            stateRef.current.height = -displayDistanceY;
          }

          setSelector({ ...stateRef.current, moving: true });
          throttledUpdateSelected();
        }
      },
    [throttledUpdateSelected]
  );

  const onDragEnd = React.useCallback(() => {
    if (stateRef.current.moving) {
      setBoardState((prev) => ({ ...prev, selecting: false }));
      stateRef.current.moving = false;
      setSelector({ moving: false });
      wrapperRef.current.style.cursor = "auto";
    }
  }, [setBoardState]);

  const onLongTap = React.useCallback(
    ({ target }) => {
      const foundElement = insideClass(target, "item");
      if (foundElement) {
        const id = getIdFromElem(foundElement);
        setSelection([id]);
      }
    },
    [setSelection]
  );

  const onTap = React.useCallback(
    async (event) => {
      const { target, ctrlKey, metaKey } = event;

      const foundElement = await findElementUnderPointer(event);

      if (!foundElement && insideClass(target, "board")) {
        clearSelection();
      } else {
        const itemId = getIdFromElem(foundElement);

        // Being defensive here to avoid bug
        if (!itemId) {
          clearSelection();
          return;
        }

        const selectedItems = getSelection();
        if (foundElement && !selectedItems.includes(itemId)) {
          if (ctrlKey || metaKey) {
            select([itemId]);
          } else {
            setSelection([itemId]);
          }
        }
      }
    },
    [clearSelection, findElementUnderPointer, select, setSelection]
  );

  return (
    <Gesture
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onTap={onTap}
      onLongTap={onLongTap}
      mainAction={moveFirst ? "pan" : "drag"}
    >
      <div ref={wrapperRef}>
        {selector.moving && (
          <div
            style={{
              ...defaultSelectorStyle,
              transform: `translate(${selector.left}px, ${selector.top}px)`,
              height: `${selector.height}px`,
              width: `${selector.width}px`,
            }}
            className="selector"
          />
        )}
        {children}
      </div>
    </Gesture>
  );
};

export default Selector;
