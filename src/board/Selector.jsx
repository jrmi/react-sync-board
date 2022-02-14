import React from "react";
import { useThrottledEffect } from "@react-hookz/web/esm";
import { useSetRecoilState, useRecoilCallback } from "recoil";

import { insideClass, isItemInsideElement } from "../utils";

import {
  BoardTransformAtom,
  ItemMapAtom,
  BoardStateAtom,
  SelectedItemsAtom,
  ConfigurationAtom,
} from "./atoms";

import Gesture from "./Gesture";

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
      const { id } = elem.dataset;
      const item = itemMap[id];
      if (!item) {
        // Avoid to find item that are not yet removed from DOM
        console.error(`Missing item ${id}`);
        return false;
      }
      if (item.locked) {
        return false;
      }
      return isItemInsideElement(elem, selector);
    })
    .map((elem) => elem.dataset.id);
};

const Selector = ({ children, moveFirst }) => {
  const setSelected = useSetRecoilState(SelectedItemsAtom);
  const setBoardState = useSetRecoilState(BoardStateAtom);

  const [selector, setSelector] = React.useState({});

  const wrapperRef = React.useRef(null);
  const stateRef = React.useRef({
    moving: false,
  });

  // Reset selection on board loading
  React.useEffect(() => {
    setSelected((prev) => (prev.length === 0 ? prev : []));
    return () => {
      setSelected((prev) => (prev.length === 0 ? prev : []));
    };
  }, [setSelected]);

  const updateSelected = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        if (stateRef.current.moving) {
          const itemMap = await snapshot.getPromise(ItemMapAtom);
          const { boardWrapper } = await snapshot.getPromise(ConfigurationAtom);
          const selected = findSelected(itemMap, boardWrapper);

          setSelected((prevSelected) => {
            if (JSON.stringify(prevSelected) !== JSON.stringify(selected)) {
              return selected;
            }
            return prevSelected;
          });
        }
      },
    [setSelected]
  );

  useThrottledEffect(updateSelected, [selector, updateSelected], 200);

  const onDragStart = ({ button, altKey, ctrlKey, metaKey, target }) => {
    const outsideItem =
      !insideClass(target, "item") || insideClass(target, "locked");

    const metaKeyPressed = altKey || ctrlKey || metaKey;

    const goodButton = moveFirst
      ? button === 1 || (button === 0 && metaKeyPressed)
      : button === 0 && !metaKeyPressed;

    if (goodButton && (outsideItem || moveFirst)) {
      stateRef.current.moving = true;
      setBoardState((prev) => ({ ...prev, selecting: true }));
      wrapperRef.current.style.cursor = "crosshair";
    }
  };

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
        }
      },
    []
  );

  const onDragEnd = () => {
    if (stateRef.current.moving) {
      setBoardState((prev) => ({ ...prev, selecting: false }));
      stateRef.current.moving = false;
      setSelector({ moving: false });
      wrapperRef.current.style.cursor = "auto";
    }
  };

  const onLongTap = React.useCallback(
    ({ target }) => {
      const foundElement = insideClass(target, "item");
      if (foundElement) {
        setSelected([foundElement.dataset.id]);
      }
    },
    [setSelected]
  );

  const onTap = useRecoilCallback(
    ({ snapshot }) =>
      async ({ target, ctrlKey, metaKey }) => {
        const foundItem = insideClass(target, "item");
        if (
          (!foundItem || insideClass(foundItem, "locked")) &&
          insideClass(target, "board")
        ) {
          setSelected([]);
        } else {
          const itemId = foundItem.dataset.id;
          const selectedItems = await snapshot.getPromise(SelectedItemsAtom);
          if (foundItem && !selectedItems.includes(itemId)) {
            if (ctrlKey || metaKey) {
              setSelected((prev) => [...prev, itemId]);
            } else {
              setSelected([itemId]);
            }
          }
        }
      },
    [setSelected]
  );

  return (
    <Gesture
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onTap={onTap}
      onLongTap={onLongTap}
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
