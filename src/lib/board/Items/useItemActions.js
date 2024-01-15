import React from "react";
import { useSyncedStore } from "@/board/store/synced";

import useDim from "../useDim";

import {
  getItemElem,
  isPointInsideRect,
  insideClass,
  hasClass,
  snapToGrid,
  getLinkedItems,
} from "@/utils";

import useItemInteraction from "./useItemInteraction";
import useMainStore from "../store/main";

const useItemActions = () => {
  const { call: callPlaceInteractions } = useItemInteraction("place");
  const { call: callDeleteInteractions } = useItemInteraction("delete");
  const { getCenter, updateItemExtent } = useDim();

  const [clearSelection, reverseSelection, unselect, getConfiguration] =
    useMainStore((state) => [
      state.clear,
      state.reverse,
      state.unselect,
      state.getConfiguration,
    ]);

  const {
    getItems: getStoreItems,
    getItemIds,
    setItemIds,
    updateItems,
    moveItems: moveStoreItems,
    removeItemsById,
    getItemList,
    insertItems,
    setItemList,
  } = useSyncedStore(
    ({
      getItems,
      getItemIds,
      setItemIds,
      updateItems,
      moveItems,
      removeItemsById,
      getItemList,
      insertItems,
      setItemList,
    }) => ({
      getItems,
      getItemIds,
      setItemIds,
      updateItems,
      moveItems,
      removeItemsById,
      getItemList,
      insertItems,
      setItemList,
    })
  );

  const batchUpdateItems = React.useCallback(
    (itemIds, callbackOrItem) => {
      let callback = callbackOrItem;
      if (typeof callbackOrItem === "object") {
        callback = () => callbackOrItem;
      }

      const orderedItemIds = getItemIds().filter((id) => itemIds.includes(id));

      const prevMap = getStoreItems();

      const toUpdate = Object.fromEntries(
        orderedItemIds.map((id) => {
          return [id, callback({ ...prevMap[id] })];
        })
      );

      updateItems(toUpdate);

      updateItemExtent();
    },
    [getItemIds, getStoreItems, updateItemExtent, updateItems]
  );

  const setItemListFull = React.useCallback(
    (itemList) => {
      setItemList(itemList);

      // Reset item selection as we are changing all items
      clearSelection();
      updateItemExtent();
    },
    [clearSelection, setItemList, updateItemExtent]
  );

  const updateItem = React.useCallback(
    (id, callbackOrItem) => {
      batchUpdateItems([id], callbackOrItem);
    },
    [batchUpdateItems]
  );

  const moveItems = React.useCallback(
    (itemIds, posDelta) => {
      moveStoreItems(
        getLinkedItems(getStoreItems(), getItemIds(), itemIds),
        posDelta
      );

      updateItemExtent();
    },
    [getItemIds, getStoreItems, moveStoreItems, updateItemExtent]
  );

  const putItemsOnTop = React.useCallback(
    (itemIdsToMove) => {
      const prevItemIds = getItemIds();
      const filtered = prevItemIds.filter((id) => !itemIdsToMove.includes(id));
      const toBePutOnTop = prevItemIds.filter((id) =>
        itemIdsToMove.includes(id)
      );

      setItemIds([...filtered, ...toBePutOnTop]);
    },
    [getItemIds, setItemIds]
  );

  const stickOnGrid = React.useCallback(
    (itemIds, { type: globalType, size: globalSize } = {}) => {
      const { boardWrapper } = getConfiguration();

      batchUpdateItems(itemIds, (item) => {
        const elem = getItemElem(boardWrapper, item.id);

        if (!elem) {
          return;
        }

        const gridConfig = {
          type: globalType || "grid",
          size: globalSize || 1,
          offset: { x: 0, y: 0 },
          ...item.grid,
        };

        const newPos = snapToGrid(
          {
            x: item.x,
            y: item.y,
            width: elem.clientWidth,
            height: elem.clientHeight,
          },
          gridConfig
        );

        return { ...item, ...newPos };
      });
    },
    [getConfiguration, batchUpdateItems]
  );

  const placeItems = React.useCallback(
    (itemIds, gridConfig) => {
      // Put all moved items on top
      const itemIdsWithLinkedItems = getLinkedItems(
        getStoreItems(),
        getItemIds(),
        itemIds
      );

      putItemsOnTop(itemIdsWithLinkedItems);

      // Remove moving state
      batchUpdateItems(itemIdsWithLinkedItems, (item) => {
        const newItem = { ...item };
        delete newItem.moving;
        return newItem;
      });
      stickOnGrid(itemIdsWithLinkedItems, gridConfig);
      callPlaceInteractions(itemIds);

      updateItemExtent();
    },
    [
      batchUpdateItems,
      callPlaceInteractions,
      getItemIds,
      getStoreItems,
      putItemsOnTop,
      stickOnGrid,
      updateItemExtent,
    ]
  );

  const updateItemOrder = React.useCallback(
    (newOrder) => {
      setItemIds(newOrder);
    },
    [setItemIds]
  );

  const reverseItemsOrder = React.useCallback(
    (itemIdsToReverse) => {
      const prevItemIds = getItemIds();

      const toBeReversed = prevItemIds.filter((id) =>
        itemIdsToReverse.includes(id)
      );
      const newOrder = prevItemIds.map((itemId) => {
        if (itemIdsToReverse.includes(itemId)) {
          return toBeReversed.pop();
        }
        return itemId;
      });

      setItemIds(newOrder);

      reverseSelection();
    },
    [getItemIds, reverseSelection, setItemIds]
  );

  const swapItems = React.useCallback(
    (fromIds, toIds) => {
      const prevItemMap = getStoreItems();

      const newCoordinatesMap = Object.fromEntries(
        toIds.map((toItemId, index) => {
          const replaceWith = prevItemMap[fromIds[index]];
          return [
            toItemId,
            {
              x: replaceWith.x,
              y: replaceWith.y,
            },
          ];
        })
      );

      batchUpdateItems(fromIds, (item) => {
        return { ...item, ...newCoordinatesMap[item.id] };
      });

      const replaceMap = Object.fromEntries(
        fromIds.map((id, index) => [id, toIds[index]])
      );

      // swap also the item order
      const reorderedItemIds = getItemIds().map((itemId) => {
        if (fromIds.includes(itemId)) {
          return replaceMap[itemId];
        }
        return itemId;
      });

      setItemIds(reorderedItemIds);
    },
    [getStoreItems, batchUpdateItems, getItemIds, setItemIds]
  );

  const pushItems = React.useCallback(
    (itemsToInsert, beforeId) => {
      const center = getCenter();

      const itemsWithPosition = itemsToInsert.map((item, index) => {
        if (!item.x || !item.y) {
          return { ...item, x: center.x + 2 * index, y: center.y + 2 * index };
        }
        return item;
      });

      insertItems(itemsWithPosition, beforeId);

      updateItemExtent();
    },
    [getCenter, insertItems, updateItemExtent]
  );

  const pushItem = React.useCallback(
    (itemToInsert, beforeId) => {
      pushItems([itemToInsert], beforeId);
    },
    [pushItems]
  );

  const removeItems = React.useCallback(
    (itemsIdToRemove) => {
      // Remove from selected items first
      unselect(itemsIdToRemove);

      removeItemsById(itemsIdToRemove);
      callDeleteInteractions(itemsIdToRemove);
    },
    [unselect, removeItemsById, callDeleteInteractions]
  );

  const getItems = React.useCallback(
    (itemIds) => {
      const itemMap = getStoreItems();
      return itemIds.map((id) => itemMap[id]);
    },
    [getStoreItems]
  );

  const findElementUnderPointer = React.useCallback(
    (
      { target, clientX, clientY },
      { returnLocked = false, passLocked = false } = {}
    ) => {
      // Allow text selection instead of moving
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return null;

      const foundElement = insideClass(target, "item");

      if (foundElement) {
        if (hasClass(foundElement, "selected")) {
          return foundElement;
        }

        if (
          !passLocked &&
          hasClass(foundElement, "locked") &&
          !hasClass(target, "passthrough")
        ) {
          return returnLocked ? foundElement : null;
        }

        // Is it a passthrough  element?
        if (hasClass(target, "passthrough")) {
          // Get current value
          const itemList = getItemIds();
          const { boardWrapper } = getConfiguration();

          // Found element under the cursor
          const elements = itemList.reduce((prev, itemId) => {
            const elem = getItemElem(boardWrapper, itemId);
            const itemRect = elem.getBoundingClientRect();
            if (isPointInsideRect({ x: clientX, y: clientY }, itemRect)) {
              prev.unshift(elem);
            }
            return prev;
          }, []);

          // Figure out if one can be returned
          for (let i = 0; i < elements.length; i += 1) {
            const elem = elements[i];
            if (
              elem !== foundElement &&
              (passLocked || !hasClass(elem, "locked"))
            ) {
              return elem;
            }
          }
          // Here there is no available elements
          return null;
        }
      }
      return foundElement;
    },
    [getConfiguration, getItemIds]
  );

  return {
    putItemsOnTop,
    batchUpdateItems,
    updateItemOrder,
    moveItems,
    placeItems,
    updateItem,
    swapItems,
    reverseItemsOrder,
    setItemList: setItemListFull,
    pushItem,
    pushItems,
    removeItems,
    getItemList,
    findElementUnderPointer,
    getItems,
  };
};

export default useItemActions;
