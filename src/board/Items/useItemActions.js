import React from "react";
import { useSetRecoilState, useRecoilCallback } from "recoil";

import useWire from "../../hooks/useWire";

import {
  ItemListAtom,
  SelectedItemsAtom,
  ItemMapAtom,
  AllItemsSelector,
} from "../atoms";
import useDim from "../useDim";

import {
  getItemElem,
  isPointInsideRect,
  insideClass,
  hasClass,
} from "../../utils";

import useItemInteraction from "./useItemInteraction";
import { ConfigurationAtom } from "..";

const useItemActions = () => {
  const { wire } = useWire("board");
  const { call: callPlaceInteractions } = useItemInteraction("place");
  const { getCenter, updateItemExtent } = useDim();

  const setItemList = useSetRecoilState(ItemListAtom);
  const setItemMap = useSetRecoilState(ItemMapAtom);
  const setSelectItems = useSetRecoilState(SelectedItemsAtom);

  const batchUpdateItems = useRecoilCallback(
    ({ snapshot }) =>
      async (itemIds, callbackOrItem, sync = true) => {
        let callback = callbackOrItem;
        if (typeof callbackOrItem === "object") {
          callback = () => callbackOrItem;
        }
        const itemList = await snapshot.getPromise(ItemListAtom);

        const orderedItemIds = itemList.filter((id) => itemIds.includes(id));

        setItemMap((prevItemMap) => {
          const result = { ...prevItemMap };
          const updatedItems = {};
          orderedItemIds.forEach((id) => {
            const newItem = { ...callback(prevItemMap[id]) };
            result[id] = newItem;
            updatedItems[id] = newItem;
          });
          if (sync) {
            wire.publish("batchItemsUpdate", updatedItems);
          }
          return result;
        });
        updateItemExtent();
      },
    [setItemMap, updateItemExtent, wire]
  );

  const setItemListFull = React.useCallback(
    (items) => {
      setItemMap(
        items.reduce((acc, item) => {
          if (item && item.id) {
            acc[item.id] = item;
          }
          return acc;
        }, {})
      );
      setItemList(items.map(({ id }) => id));
      // Reset item selection as we are changing all items
      setSelectItems([]);
      updateItemExtent();
    },
    [setItemList, setItemMap, setSelectItems, updateItemExtent]
  );

  const updateItem = React.useCallback(
    (id, callbackOrItem, sync = true) => {
      batchUpdateItems([id], callbackOrItem, sync);
    },
    [batchUpdateItems]
  );

  const moveItems = React.useCallback(
    (itemIds, posDelta, sync = true) => {
      setItemMap((prevItemMap) => {
        const result = { ...prevItemMap };
        itemIds.forEach((id) => {
          const item = prevItemMap[id];

          if (!item) {
            return;
          }

          result[id] = {
            ...item,
            x: (item.x || 0) + posDelta.x,
            y: (item.y || 0) + posDelta.y,
            moving: true,
          };
        });
        return result;
      });

      if (sync) {
        wire.publish("selectedItemsMove", {
          itemIds,
          posDelta,
        });
      }

      updateItemExtent();
    },
    [setItemMap, updateItemExtent, wire]
  );

  const putItemsOnTop = React.useCallback(
    (itemIdsToMove, sync = true) => {
      setItemList((prevItemList) => {
        const filtered = prevItemList.filter(
          (id) => !itemIdsToMove.includes(id)
        );
        const toBePutOnTop = prevItemList.filter((id) =>
          itemIdsToMove.includes(id)
        );
        const result = [...filtered, ...toBePutOnTop];
        if (sync) {
          wire.publish("updateItemListOrder", result);
        }
        return result;
      });
    },
    [setItemList, wire]
  );

  const stickOnGrid = useRecoilCallback(
    ({ snapshot }) =>
      async (
        itemIds,
        { type: globalType, size: globalSize } = {},
        sync = true
      ) => {
        const { boardWrapper } = await snapshot.getPromise(ConfigurationAtom);
        const updatedItems = {};
        setItemMap((prevItemMap) => {
          const result = { ...prevItemMap };
          itemIds.forEach((id) => {
            const item = prevItemMap[id];
            const elem = getItemElem(boardWrapper, id);

            if (!elem) {
              return;
            }

            const { type: itemType, size: itemSize } = item.grid || {};
            let type = globalType;
            let size = globalSize || 1;
            // If item specific
            if (itemType) {
              type = itemType;
              size = itemSize || 1;
            }

            const [centerX, centerY] = [
              item.x + elem.clientWidth / 2,
              item.y + elem.clientHeight / 2,
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
              x: newX - elem.clientWidth / 2,
              y: newY - elem.clientHeight / 2,
            };
            updatedItems[id] = result[id];
          });
          return result;
        });

        if (sync) {
          wire.publish("batchItemsUpdate", updatedItems);
        }
      },
    [wire, setItemMap]
  );

  const placeItems = React.useCallback(
    async (itemIds, gridConfig, sync = true) => {
      // Put moved items on top
      putItemsOnTop(itemIds, sync);
      // Remove moving state
      batchUpdateItems(
        itemIds,
        (item) => {
          const newItem = { ...item };
          delete newItem.moving;
          return newItem;
        },
        sync
      );
      stickOnGrid(itemIds, gridConfig, sync);
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
    (newOrder, sync = true) => {
      setItemList(newOrder);
      if (sync) {
        wire.publish("updateItemListOrder", newOrder);
      }
    },
    [wire, setItemList]
  );

  const reverseItemsOrder = React.useCallback(
    (itemIdsToReverse, sync = true) => {
      setItemList((prevItemList) => {
        const toBeReversed = prevItemList.filter((id) =>
          itemIdsToReverse.includes(id)
        );
        const result = prevItemList.map((itemId) => {
          if (itemIdsToReverse.includes(itemId)) {
            return toBeReversed.pop();
          }
          return itemId;
        });
        if (sync) {
          wire.publish("updateItemListOrder", result);
        }
        return result;
      });
      // Also reverse selected items
      setSelectItems((prev) => {
        const reversed = [...prev];
        reversed.reverse();
        return reversed;
      });
    },
    [setItemList, wire, setSelectItems]
  );

  const swapItems = useRecoilCallback(
    ({ snapshot }) =>
      async (fromIds, toIds, sync = true) => {
        const itemMap = await snapshot.getPromise(ItemMapAtom);
        const fromItems = fromIds.map((id) => itemMap[id]);
        const toItems = toIds.map((id) => itemMap[id]);

        const replaceMapItems = toIds.reduce((theMap, id) => {
          // eslint-disable-next-line no-param-reassign
          theMap[id] = fromItems.shift();
          return theMap;
        }, {});

        setItemMap((prevItemMap) => {
          const updatedItems = toItems.reduce((prev, toItem) => {
            const replaceBy = replaceMapItems[toItem.id];
            const newItem = {
              ...toItem,
              x: replaceBy.x,
              y: replaceBy.y,
            };
            // eslint-disable-next-line no-param-reassign
            prev[toItem.id] = newItem;
            return prev;
          }, {});
          if (sync) {
            wire.publish("batchItemsUpdate", updatedItems);
          }
          return { ...prevItemMap, ...updatedItems };
        });

        const replaceMap = fromIds.reduce((theMap, id) => {
          // eslint-disable-next-line no-param-reassign
          theMap[id] = toIds.shift();
          return theMap;
        }, {});

        setItemList((prevItemList) => {
          const result = prevItemList.map((itemId) => {
            if (fromIds.includes(itemId)) {
              return replaceMap[itemId];
            }
            return itemId;
          });

          if (sync) {
            wire.publish("updateItemListOrder", result);
          }
          return result;
        });
      },
    [wire, setItemList, setItemMap]
  );

  const pushItems = React.useCallback(
    async (itemsToInsert, beforeId, sync = true) => {
      itemsToInsert.forEach(async (item, index) => {
        const center = await getCenter();
        const newItem = { ...item };
        if (!newItem.x || !newItem.y) {
          newItem.x = center.x + 2 * index;
          newItem.y = center.y + 2 * index;
        }

        setItemMap((prevItemMap) => ({
          ...prevItemMap,
          [newItem.id]: newItem,
        }));

        setItemList((prevItemList) => {
          if (beforeId) {
            const insertAt = prevItemList.findIndex((id) => id === beforeId);

            const newItemList = [...prevItemList];
            newItemList.splice(insertAt, 0, newItem.id);
            return newItemList;
          }
          return [...prevItemList, newItem.id];
        });
        if (sync) {
          wire.publish("insertItemBefore", [newItem, beforeId]);
        }
      });

      updateItemExtent();
    },
    [updateItemExtent, getCenter, setItemMap, setItemList, wire]
  );

  const pushItem = React.useCallback(
    (itemToInsert, beforeId, sync = true) => {
      pushItems([itemToInsert], beforeId, sync);
    },
    [pushItems]
  );

  const removeItems = React.useCallback(
    (itemsIdToRemove, sync = true) => {
      // Remove from selected items first
      setSelectItems((prevList) =>
        prevList.filter((id) => !itemsIdToRemove.includes(id))
      );

      setItemList((prevItemList) =>
        prevItemList.filter((itemId) => !itemsIdToRemove.includes(itemId))
      );

      setItemMap((prevItemMap) => {
        const result = { ...prevItemMap };
        itemsIdToRemove.forEach((id) => {
          delete result[id];
        });
        return result;
      });

      if (sync) {
        wire.publish("removeItems", itemsIdToRemove);
      }
    },
    [wire, setItemList, setItemMap, setSelectItems]
  );

  const getItemList = useRecoilCallback(
    ({ snapshot }) =>
      () =>
        snapshot.getPromise(AllItemsSelector),
    []
  );

  const getItems = useRecoilCallback(
    ({ snapshot }) =>
      async (itemIds) => {
        const itemMap = await snapshot.getPromise(ItemMapAtom);
        return itemIds.map((id) => itemMap[id]);
      },
    []
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
          if (!passLocked && hasClass(foundElement, "locked")) {
            return null;
          }

          // Is it a passthrough  element?
          const isPassthrough =
            (hasClass(target, "passthrough") ||
              (!returnLocked && hasClass(foundElement, "locked"))) &&
            !hasClass(foundElement, "selected");

          if (isPassthrough) {
            // Get atoms value
            const itemList = await snapshot.getPromise(ItemListAtom);
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
                (returnLocked || !hasClass(elem, "locked"))
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
    []
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
