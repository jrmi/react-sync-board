import React from "react";
import { useItemActions, useSelectedItems } from "@/";

import deleteIcon from "./images/delete.svg";
import lockIcon from "./images/lock.svg";
import rotateIcon from "./images/rotate.svg";

const shuffleArray = (array) => {
  return array
    .map((value) => ({ value, random: Math.random() }))
    .sort((a, b) => a.random - b.random)
    .map((item) => item.value);
};

const t = (s) => s;
const useActions = () => {
  const { batchUpdateItems, removeItems, getItems, swapItems } =
    useItemActions();
  const selectedItems = useSelectedItems();

  const getItemListOrSelected = React.useCallback(
    async (itemIds) => {
      if (itemIds) {
        return [itemIds, await getItems(itemIds)];
      }
      return [selectedItems, await getItems(selectedItems)];
    },
    [getItems, selectedItems]
  );

  const toggleLock = React.useCallback(
    (itemIds) => {
      batchUpdateItems(
        itemIds,
        (item) => ({
          locked: !item.locked,
        }),
        true
      );
    },
    [batchUpdateItems]
  );

  const remove = React.useCallback(
    (itemIds) => {
      removeItems(itemIds);
    },
    [removeItems]
  );

  // Rotate element
  const rotate = React.useCallback(
    async (itemIds, { angle }) => {
      const [ids] = await getItemListOrSelected(itemIds);

      batchUpdateItems(
        ids,
        (item) => ({
          rotation: (item.rotation || 0) + angle,
        }),
        true
      );
    },
    [getItemListOrSelected, batchUpdateItems]
  );

  const shuffleItems = React.useCallback(
    async (itemIds) => {
      const [ids] = await getItemListOrSelected(itemIds);

      const shuffledItems = shuffleArray([...ids]);
      swapItems(ids, shuffledItems);
    },
    [getItemListOrSelected, swapItems]
  );

  const actionMap = React.useMemo(
    () => ({
      lock: {
        action: toggleLock,
        label: `${t("Unlock")}/${t("Lock")}`,
        disableDblclick: true,
        icon: lockIcon,
      },
      remove: {
        action: remove,
        label: t("Remove all"),
        shortcut: "Delete",
        edit: true,
        disableDblclick: true,
        icon: deleteIcon,
      },
      shuffle: {
        action: shuffleItems,
        label: t("Shuffle"),
        shortcut: "z",
        edit: false,
        disableDblclick: false,
        icon: rotateIcon,
      },
      rotate: {
        action: rotate,
        label: t("Rotate"),
        shortcut: "r",
        icon: rotateIcon,
      },
      rotate45: {
        action: (itemIds) => rotate(itemIds, { angle: 45 }),
        label: t("Rotate 45"),
        shortcut: "r",
        icon: rotateIcon,
      },
      rotate90: {
        action: (itemIds) => rotate(itemIds, { angle: 90 }),
        label: t("Rotate 90"),
        shortcut: "r",
        icon: rotateIcon,
      },
    }),
    [remove, rotate, shuffleItems, toggleLock]
  );

  return actionMap;
};

export default useActions;
