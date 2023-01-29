import React, { useCallback } from "react";
import deepEqual from "fast-deep-equal/es6";

import { useDebouncedEffect } from "@react-hookz/web/esm";

import { useSyncedItems } from "../store/items";
import useSelection from "../store/selection";
import useMainStore from "../store/main";

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
  const [items, getItems] = useSyncedItems((state) => [
    state.items,
    state.getItems,
  ]);
  const itemTemplates = useMainStore((state) => state.config.itemTemplates);
  const [selection, getSelection] = useSelection((state) => [
    state.selection,
    state.getSelection,
  ]);
  const [availableActions, setAvailableActions] = React.useState([]);
  const isMountedRef = React.useRef(false);

  React.useEffect(() => {
    // Mounted guard
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getItemListOrSelected = React.useCallback(
    (itemIds) => {
      const currentItemMap = getItems();
      if (itemIds) {
        return [itemIds, itemIds.map((id) => currentItemMap[id])];
      }
      const selectedItems = getSelection();
      return [selectedItems, selectedItems.map((id) => currentItemMap[id])];
    },
    [getItems, getSelection]
  );

  /**
   * Returns available actions for selected items. An action is kept only if all
   * items have this exact same action with same parameters.
   */
  const updateAvailableActions = useCallback(() => {
    const [selectedItemIds, selectedItemList] = getItemListOrSelected();
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
  React.useEffect(() => {
    updateAvailableActions();
  }, [updateAvailableActions, selection]);

  // Debounced update available actions when items change
  useDebouncedEffect(
    updateAvailableActions,
    [items, updateAvailableActions],
    300
  );

  return {
    availableActions,
  };
};

export default useAvailableActions;
