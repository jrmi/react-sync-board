import React from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";

import { ConfigurationAtom, ItemMapAtom, SelectedItemsAtom } from "../atoms";
import useItems from "./useItems";

const useItemActions = () => {
  const baseActions = useItems();
  const { actions } = useRecoilValue(ConfigurationAtom);

  const actionWrapper = useRecoilCallback(
    ({ snapshot }) => async (action, itemIds, config = {}) => {
      const currentItemMap = await snapshot.getPromise(ItemMapAtom);
      let items;
      if (itemIds) {
        items = itemIds.map((id) => currentItemMap[id]);
      } else {
        const selectedItems = await snapshot.getPromise(SelectedItemsAtom);
        items = selectedItems.map((id) => currentItemMap[id]);
      }
      await action(items, config, baseActions);
    },
    []
  );

  const allActions = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(actions).map(([key, action]) => {
          const newAction = { ...action };
          newAction.action = (itemIds, config) =>
            actionWrapper(action.action, itemIds, config);
          return [key, newAction];
        })
      ),
    [actionWrapper, actions]
  );

  return allActions;
};

export default useItemActions;
