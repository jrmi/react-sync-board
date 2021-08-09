import React from "react";
import useTranslation from "@/hooks/useTranslation";
import { useRecoilCallback } from "recoil";

import { useItemActions } from "../board/Items";
import { SelectedItemsAtom, ItemMapAtom } from "../board";

import deleteIcon from "../images/delete.svg";
import lockIcon from "../images/lock.svg";

const useGameItemActionMap = () => {
  const { removeItems, batchUpdateItems } = useItemActions();

  const { t } = useTranslation();

  const isMountedRef = React.useRef(false);

  const getItemListOrSelected = useRecoilCallback(
    ({ snapshot }) => async (itemIds) => {
      const itemMap = await snapshot.getPromise(ItemMapAtom);
      if (itemIds) {
        return [itemIds, itemIds.map((id) => itemMap[id])];
      }
      const selectedItems = await snapshot.getPromise(SelectedItemsAtom);
      return [selectedItems, selectedItems.map((id) => itemMap[id])];
    },
    []
  );

  React.useEffect(() => {
    // Mounted guard
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Lock / unlock elements
  const toggleLock = React.useCallback(
    async (itemIds) => {
      const [ids] = await getItemListOrSelected(itemIds);

      batchUpdateItems(ids, (item) => ({
        ...item,
        locked: !item.locked,
      }));
    },
    [getItemListOrSelected, batchUpdateItems]
  );

  const remove = React.useCallback(
    async (itemIds) => {
      const [ids] = await getItemListOrSelected(itemIds);
      removeItems(ids);
    },
    [getItemListOrSelected, removeItems]
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
    }),
    [toggleLock, t, remove]
  );

  return { actionMap };
};
export default useGameItemActionMap;
