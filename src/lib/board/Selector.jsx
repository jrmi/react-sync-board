import React from "react";
import { css } from "goober";
import { useEventListener } from "@react-hookz/web/esm/useEventListener";

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

/**
 * Find selected element by using their visible screen dimensions.
 *
 * @param {Array} itemMap
 * @param {DomObject} wrapper
 * @param {boolean} ignoreLocked
 * @returns
 */
const findSelected = (itemMap, wrapper, ignoreLocked = false) => {
  const selectors = wrapper.getElementsByClassName("selector");
  if (!selectors.length) {
    return [];
  }

  const selector = selectors[0];

  return Array.from(wrapper.getElementsByClassName("item"))
    .filter((elem) => {
      const id = getIdFromElem(elem);

      const item = itemMap[id];
      if (!item || (!ignoreLocked && item.locked)) {
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
  const [ignoreLocked, setIgnoreLocked] = React.useState(false);

  const wrapperRef = React.useRef(null);
  const stateRef = React.useRef({
    moving: false,
  });

  useEventListener(document, "keydown", (e) => {
    if (e.key === "l") {
      setIgnoreLocked(true);
    }
  });

  useEventListener(document, "keyup", (e) => {
    if (e.key === "l") {
      setIgnoreLocked(false);
    }
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
      const selected = findSelected(itemMap, boardWrapper, ignoreLocked);
      startTransition(() => {
        setSelection(selected);
      });
    }
  }, [getConfiguration, getItems, selector, setSelection, ignoreLocked]);

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

      const relativeX = startX - left;
      const relativeY = startY - top;

      if (distanceX > 0) {
        stateRef.current.left = relativeX;
        stateRef.current.width = distanceX;
      } else {
        stateRef.current.left = relativeX + distanceX;
        stateRef.current.width = -distanceX;
      }
      if (distanceY > 0) {
        stateRef.current.top = relativeY;
        stateRef.current.height = distanceY;
      } else {
        stateRef.current.top = relativeY + distanceY;
        stateRef.current.height = -distanceY;
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
