import React from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";
import intersection from "lodash.intersection";

import { SelectedItemsAtom, ItemMapAtom } from "..";
import { ConfigurationAtom } from "../atoms";

export const getDefaultActionsFromItem = (item, itemMap) => {
  if (item.type in itemMap) {
    const actions = itemMap[item.type].defaultActions;
    if (typeof actions === "function") {
      return actions(item);
    }
    return actions;
  }

  return [];
};

export const getAvailableActionsFromItem = (item, itemMap) => {
  if (item.type in itemMap) {
    const actions = itemMap[item.type].availableActions;
    if (typeof actions === "function") {
      return actions(item);
    }
    return actions;
  }

  return [];
};

export const getActionsFromItem = (item, itemMap) => {
  const { actions = getDefaultActionsFromItem(item, itemMap) } = item;
  // Filter availableActions to keep same order
  return getAvailableActionsFromItem(item, itemMap).filter((action) =>
    actions.includes(action)
  );
};

const useAvailableActions = () => {
  const { itemTemplates: itemMap } = useRecoilValue(ConfigurationAtom);
  const selected = useRecoilValue(SelectedItemsAtom);
  const [availableActions, setAvailableActions] = React.useState([]);
  const isMountedRef = React.useRef(false);

  const getItemListOrSelected = useRecoilCallback(
    ({ snapshot }) => async (itemIds) => {
      const currentItemMap = await snapshot.getPromise(ItemMapAtom);
      if (itemIds) {
        return [itemIds, itemIds.map((id) => currentItemMap[id])];
      }
      const selectedItems = await snapshot.getPromise(SelectedItemsAtom);
      return [selectedItems, selectedItems.map((id) => currentItemMap[id])];
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

  const updateAvailableActions = React.useCallback(async () => {
    const [selectedItemIds, selectedItemList] = await getItemListOrSelected();
    if (selectedItemIds.length > 0) {
      // Prevent set state on unmounted component
      if (!isMountedRef.current) return;

      const allActions = selectedItemList.reduce(
        (acc, item) => intersection(acc, getActionsFromItem(item, itemMap)),
        getActionsFromItem(selectedItemList[0], itemMap)
      );

      setAvailableActions(allActions);
    } else {
      setAvailableActions([]);
    }
  }, [getItemListOrSelected, itemMap]);

  // Update available actions when selection change
  React.useEffect(() => {
    updateAvailableActions();
  }, [updateAvailableActions, selected]);

  return {
    availableActions,
  };
};

export default useAvailableActions;
