import React, { useCallback } from "react";
import deepEqual from "fast-deep-equal/es6";
import { useRecoilValue, useRecoilCallback } from "recoil";

import { useDebouncedEffect } from "@react-hookz/web/esm";

import { SelectedItemsAtom, ItemMapAtom } from "..";
import { ConfigurationAtom } from "../atoms";

/**
 * Returns the default actions of an item
 * @param {object} item to consider
 * @param {object} itemMap item template map with default actions
 * @returns An array of default action for this item
 */
const getDefaultActionsFromItem = (item, itemMap) => {
  if (item.type in itemMap) {
    const actions = itemMap[item.type].defaultActions;
    if (typeof actions === "function") {
      return actions(item);
    }
    return actions;
  }

  return [];
};

/**
 * Returns actual actions from an item ordered by the configured available
 * actions. If no action is defined, default actions are returned.
 * @param {object} item item to use
 * @param {object} itemMap item template map with available action for this item
 * @returns the array of actions for this item
 */
const getActionsFromItem = (item, itemMap) => {
  const { actions = getDefaultActionsFromItem(item, itemMap) } = item;
  return actions.map((action) => {
    if (typeof action === "string") {
      return { name: action };
    }
    return action;
  });
};

const useAvailableActions = () => {
  const itemMap = useRecoilValue(ItemMapAtom);
  const { itemTemplates } = useRecoilValue(ConfigurationAtom);
  const selected = useRecoilValue(SelectedItemsAtom);
  const [availableActions, setAvailableActions] = React.useState([]);
  const isMountedRef = React.useRef(false);

  React.useEffect(() => {
    // Mounted guard
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getItemListOrSelected = useRecoilCallback(
    ({ snapshot }) =>
      async (itemIds) => {
        const currentItemMap = await snapshot.getPromise(ItemMapAtom);
        if (itemIds) {
          return [itemIds, itemIds.map((id) => currentItemMap[id])];
        }
        const selectedItems = await snapshot.getPromise(SelectedItemsAtom);
        return [selectedItems, selectedItems.map((id) => currentItemMap[id])];
      },
    []
  );

  /**
   * Returns available actions for selected items. An action is kept only if all
   * items have this exact same action with same parameters.
   */
  const updateAvailableActions = useCallback(async () => {
    const [selectedItemIds, selectedItemList] = await getItemListOrSelected();
    if (selectedItemIds.length > 0) {
      // Prevent set state on unmounted component
      if (!isMountedRef.current) return;

      const allActions = selectedItemList.reduce((acc, item) => {
        const itemActions = getActionsFromItem(item, itemTemplates);

        return acc.filter((value) =>
          itemActions.some((itemAction) => deepEqual(value, itemAction))
        );
      }, getActionsFromItem(selectedItemList[0], itemTemplates));

      setAvailableActions(allActions);
    } else {
      setAvailableActions([]);
    }
  }, [getItemListOrSelected, itemTemplates]);

  // Update available actions when selection change
  React.useEffect(updateAvailableActions, [updateAvailableActions, selected]);

  // Debounced update available actions when items change
  useDebouncedEffect(
    updateAvailableActions,
    [itemMap, updateAvailableActions],
    300
  );

  return {
    availableActions,
  };
};

export default useAvailableActions;
