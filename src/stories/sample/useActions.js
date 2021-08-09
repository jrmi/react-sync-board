import React from "react";
import { useItemActions } from "@/";

import deleteIcon from "./images/delete.svg";
import lockIcon from "./images/lock.svg";

const t = (s) => s;
const useActions = () => {
  const { batchUpdateItems, removeItems } = useItemActions();

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
    [remove, toggleLock]
  );

  return actionMap;
};

export default useActions;
