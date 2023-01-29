import React from "react";
import { useSetRecoilState, useRecoilCallback } from "recoil";
import { useSyncedItems } from "@/board/store/items";

import { ConfigurationAtom } from "../atoms";

import useDim from "../useDim";

import {
  getItemElem,
  isPointInsideRect,
  insideClass,
  hasClass,
  snapToGrid,
} from "@/utils";

import useItemInteraction from "./useItemInteraction";
import useSelection from "../store/selection";

const useItemActions = () => {
  const { call: callPlaceInteractions } = useItemInteraction("place");
  const { getCenter, updateItemExtent } = useDim();

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
  } = useSyncedItems(
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

  const [clearSelection, reverseSelection, unselect] = useSelection((state) => [
    state.clear,
    state.reverse,
    state.unselect,
  ]);

  const batchUpdateItems = React.useCallback(
    async (itemIds, callbackOrItem) => {
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
    (id, callbackOrItem, sync = true) => {
      batchUpdateItems([id], callbackOrItem, sync);
    },
    [batchUpdateItems]
  );

  const moveItems = React.useCallback(
    (itemIds, posDelta) => {
      moveStoreItems(itemIds, posDelta);
      updateItemExtent();
    },
    [moveStoreItems, updateItemExtent]
  );

  const putItemsOnTop = React.useCallback(
    async (itemIdsToMove) => {
      const prevItemIds = getItemIds();
      const filtered = prevItemIds.filter((id) => !itemIdsToMove.includes(id));
      const toBePutOnTop = prevItemIds.filter((id) =>
        itemIdsToMove.includes(id)
      );

      setItemIds([...filtered, ...toBePutOnTop]);
    },
    [getItemIds, setItemIds]
  );

  const stickOnGrid = useRecoilCallback(
    ({ snapshot }) =>
      async (itemIds, { type: globalType, size: globalSize } = {}) => {
        const { boardWrapper } = await snapshot.getPromise(ConfigurationAtom);
        const updatedItems = {};

        const prevItemMap = getStoreItems();

        itemIds.forEach((id) => {
          const item = prevItemMap[id];
          const elem = getItemElem(boardWrapper, id);

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

          updatedItems[id] = { ...item, ...newPos };
        });

        updateItems(updatedItems);
      },
    [getStoreItems, updateItems]
  );

  const placeItems = React.useCallback(
    async (itemIds, gridConfig) => {
      // Put moved items on top
      putItemsOnTop(itemIds);
      // Remove moving state
      batchUpdateItems(itemIds, (item) => {
        const newItem = { ...item };
        delete newItem.moving;
        return newItem;
      });
      stickOnGrid(itemIds, gridConfig);
      callPlaceInteractions(itemIds);

      updateItemExtent();
    },
    [
      batchUpdateItems,
      callPlaceInteractions,
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
    async (itemIdsToReverse) => {
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

  // TODO
  const swapItems = React.useCallback(
    async (fromIds, toIds) => {
      const prevItemMap = getStoreItems();
      const fromItems = fromIds.map((id) => prevItemMap[id]);
      const toItems = toIds.map((id) => prevItemMap[id]);

      const replaceMapItems = toIds.reduce((theMap, id) => {
        // eslint-disable-next-line no-param-reassign
        theMap[id] = fromItems.shift();
        return theMap;
      }, {});

      const updatedItems = toItems.reduce((acc, toItem) => {
        const replaceBy = replaceMapItems[toItem.id];
        const newItem = {
          ...toItem,
          x: replaceBy.x,
          y: replaceBy.y,
        };
        // eslint-disable-next-line no-param-reassign
        acc[toItem.id] = newItem;
        return acc;
      }, {});

      updateItems(updatedItems);

      const replaceMap = fromIds.reduce((theMap, id) => {
        // eslint-disable-next-line no-param-reassign
        theMap[id] = toIds.shift();
        return theMap;
      }, {});

      const prevItemIds = getItemIds();

      const newItemIds = prevItemIds.map((itemId) => {
        if (fromIds.includes(itemId)) {
          return replaceMap[itemId];
        }
        return itemId;
      });

      setItemIds(newItemIds);
    },
    [getStoreItems, updateItems, getItemIds, setItemIds]
  );

  const pushItems = React.useCallback(
    async (itemsToInsert, beforeId) => {
      const center = await getCenter();

      const itemsWithPosition = itemsToInsert.map((item, index) => {
        return { ...item, x: center.x + 2 * index, y: center.y + 2 * index };
      });

      insertItems(itemsWithPosition, beforeId);

      updateItemExtent();
    },
    [getCenter, insertItems, updateItemExtent]
  );

  const pushItem = React.useCallback(
    (itemToInsert, beforeId, sync = true) => {
      pushItems([itemToInsert], beforeId, sync);
    },
    [pushItems]
  );

  const removeItems = React.useCallback(
    (itemsIdToRemove) => {
      // Remove from selected items first
      unselect(itemsIdToRemove);

      removeItemsById(itemsIdToRemove);
    },
    [unselect, removeItemsById]
  );

  const getItems = React.useCallback(
    async (itemIds) => {
      const itemMap = getStoreItems();
      return itemIds.map((id) => itemMap[id]);
    },
    [getStoreItems]
  );

  const findElementUnderPointer = useRecoilCallback(
    ({ snapshot }) =>
      async (
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
            const { boardWrapper } = await snapshot.getPromise(
              ConfigurationAtom
            );

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
            // Here there is not available elements
            return null;
          }
        }
        return foundElement;
      },
    [getItemIds]
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
