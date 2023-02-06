import React from "react";
import { css } from "goober";

import { insideClass, isItemInsideElement, getIdFromElem } from "@/utils";

import Gesture from "./Gesture";
import { useItemActions } from "./Items";
import { useSyncedStore } from "@/board/store/synced";
import useMainStore from "./store/main";

const defaultSelectorClass = css({
  zIndex: 210,
  position: "absolute",
  backgroundColor: "hsla(0, 40%, 50%, 10%)",
  border: "2px solid hsl(0, 55%, 40%)",
});

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
  const [
    getSelection,
    clearSelection,
    setSelection,
    select,
    getConfiguration,
    getBoardState,
    updateBoardState,
  ] = useMainStore((state) => [
    state.getSelection,
    state.clear,
    state.setSelection,
    state.select,
    state.getConfiguration,
    state.getBoardState,
    state.updateBoardState,
  ]);
  const { findElementUnderPointer } = useItemActions();
  const [getItems] = useSyncedStore((state) => [state.getItems]);

  const [selector, setSelector] = React.useState({});
  const [, startTransition] = React.useTransition();

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

  React.useEffect(() => {
    if (stateRef.current.moving) {
      const itemMap = getItems();
      const { boardWrapper } = getConfiguration();
      const selected = findSelected(itemMap, boardWrapper);
      startTransition(() => {
        setSelection(selected);
      });
    }
  }, [getConfiguration, getItems, selector, setSelection]);

  const onDragStart = async (event) => {
    const foundElement = await findElementUnderPointer(event);

    if (!foundElement) {
      stateRef.current.moving = true;
      startTransition(() => {
        updateBoardState({ selecting: true });
      });
      wrapperRef.current.style.cursor = "crosshair";
    }
  };

  const onDrag = ({ distanceY, distanceX, startX, startY }) => {
    if (stateRef.current.moving) {
      const { top, left } = wrapperRef.current.getBoundingClientRect();

      const { scale } = getBoardState();

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
    }
  };

  const onDragEnd = () => {
    if (stateRef.current.moving) {
      startTransition(() => {
        updateBoardState({ selecting: false });
      });
      stateRef.current.moving = false;
      setSelector({ moving: false });
      wrapperRef.current.style.cursor = "auto";
    }
  };

  const onLongTap = ({ target }) => {
    const foundElement = insideClass(target, "item");
    if (foundElement) {
      const id = getIdFromElem(foundElement);
      setSelection([id]);
    }
  };

  const onTap = (event) => {
    const { target, ctrlKey, metaKey } = event;

    const foundElement = findElementUnderPointer(event);

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
  };

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
              transform: `translate(${selector.left}px, ${selector.top}px)`,
              height: `${selector.height}px`,
              width: `${selector.width}px`,
            }}
            className={`selector ${defaultSelectorClass}`}
          />
        )}
        {children}
      </div>
    </Gesture>
  );
};

export default Selector;
