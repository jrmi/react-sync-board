import React from "react";
import { useSetRecoilState, useRecoilCallback } from "recoil";
import { useSyncedItems } from "@/board/Store/items";

import { SelectedItemsAtom, ConfigurationAtom } from "../atoms";

import useDim from "../useDim";

import {
  getItemElem,
  isPointInsideRect,
  insideClass,
  hasClass,
  snapToGrid,
} from "@/utils";

import useItemInteraction from "./useItemInteraction";

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

  const setSelectItems = useSetRecoilState(SelectedItemsAtom);

  const batchUpdateItems = React.useCallback(
    async (itemIds, callbackOrItem) => {
      let callback = callbackOrItem;
      if (typeof callbackOrItem === "object") {
        callback = () => callbackOrItem;
      }

      const orderedItemIds = (await getItemIds()).filter((id) =>
        itemIds.includes(id)
      );

      const prevMap = await getStoreItems();

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
      setSelectItems([]);
      updateItemExtent();
    },
    [setItemList, setSelectItems, updateItemExtent]
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
      const prevItemIds = await getItemIds();
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

        const prevItemMap = await getStoreItems();
        itemIds.forEach((id) => {
          const item = prevItemMap[id];
          const elem = getItemElem(boardWrapper, id);

          if (!elem) {
            return;
          }

          /*const {
            type: itemType,
            size: itemSize,
            offset: { x: offsetX = 0, y: offsetY = 0 } = {},
          } = item.grid || {};

          let type = globalType;
          let size = globalSize || 1;
          // If item specific
          if (itemType) {
            type = itemType;
            size = itemSize || 1;
          }*/

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

          /*const [centerX, centerY] = [
            item.x + elem.clientWidth / 2 - offsetX,
            item.y + elem.clientHeight / 2 - offsetY,
          ];

          let newX;
          let newY;
          let sizeX;
          let sizeY;
          let px1;
          let px2;
          let py1;
          let py2;
          let diff1;
          let diff2;
          const h = size / 1.1547;

          switch (type) {
            case "grid":
              newX = Math.round(centerX / size) * size;
              newY = Math.round(centerY / size) * size;
              break;
            case "hexH":
              sizeX = 2 * h;
              sizeY = 3 * size;
              px1 = Math.round(centerX / sizeX) * sizeX;
              py1 = Math.round(centerY / sizeY) * sizeY;

              px2 = px1 > centerX ? px1 - h : px1 + h;
              py2 = py1 > centerY ? py1 - 1.5 * size : py1 + 1.5 * size;

              diff1 = Math.hypot(...[px1 - centerX, py1 - centerY]);
              diff2 = Math.hypot(...[px2 - centerX, py2 - centerY]);

              if (diff1 < diff2) {
                newX = px1;
                newY = py1;
              } else {
                newX = px2;
                newY = py2;
              }
              break;
            case "hexV":
              sizeX = 3 * size;
              sizeY = 2 * h;
              px1 = Math.round(centerX / sizeX) * sizeX;
              py1 = Math.round(centerY / sizeY) * sizeY;

              px2 = px1 > centerX ? px1 - 1.5 * size : px1 + 1.5 * size;
              py2 = py1 > centerY ? py1 - h : py1 + h;

              diff1 = Math.hypot(...[px1 - centerX, py1 - centerY]);
              diff2 = Math.hypot(...[px2 - centerX, py2 - centerY]);

              if (diff1 < diff2) {
                newX = px1;
                newY = py1;
              } else {
                newX = px2;
                newY = py2;
              }
              break;
            default:
              newX = item.x + elem.clientWidth / 2;
              newY = item.y + elem.clientHeight / 2;
          }

          result[id] = {
            ...item,
            x: newX + offsetX - elem.clientWidth / 2,
            y: newY + offsetY - elem.clientHeight / 2,
          };*/

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
      const prevItemIds = await getItemIds();

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

      // Also reverse selected items
      setSelectItems((prev) => {
        const reversed = [...prev];
        reversed.reverse();
        return reversed;
      });
    },
    [getItemIds, setItemIds, setSelectItems]
  );

  // TODO
  const swapItems = React.useCallback(
    async (fromIds, toIds) => {
      const prevItemMap = await getStoreItems();
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

      const prevItemIds = await getItemIds();

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
      setSelectItems((prevList) =>
        prevList.filter((id) => !itemsIdToRemove.includes(id))
      );

      removeItemsById(itemsIdToRemove);
    },
    [setSelectItems, removeItemsById]
  );

  const getItems = React.useCallback(
    async (itemIds) => {
      const itemMap = await getStoreItems();
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
            const itemList = await getItemIds();
            const { boardWrapper } = await snapshot.getPromise(
              ConfigurationAtom
            );

            // Found element under the cursor
            const elems = itemList.reduce((prev, itemId) => {
              const elem = getItemElem(boardWrapper, itemId);
              const itemRect = elem.getBoundingClientRect();
              if (isPointInsideRect({ x: clientX, y: clientY }, itemRect)) {
                prev.unshift(elem);
              }
              return prev;
            }, []);

            // Figure out if one can be returned
            for (let i = 0; i < elems.length; i += 1) {
              const elem = elems[i];
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
