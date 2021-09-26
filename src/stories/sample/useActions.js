import React from "react";
import { useItemActions, useSelectedItems } from "@/";

import deleteIcon from "./images/delete.svg";
import lockIcon from "./images/lock.svg";
import rotateIcon from "./images/rotate.svg";

const t = (s) => s;
const useActions = () => {
  const { batchUpdateItems, removeItems, getItems } = useItemActions();
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
      batchUpdateItems(itemIds, (item) => ({
        ...item,
        locked: !item.locked,
      }));
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

      batchUpdateItems(ids, (item) => ({
        ...item,
        rotation: (item.rotation || 0) + angle,
      }));
    },
    [getItemListOrSelected, batchUpdateItems]
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
    [remove, rotate, toggleLock]
  );

  return actionMap;
};

export default useActions;
