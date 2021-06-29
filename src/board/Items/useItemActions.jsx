import React from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";

import { ConfigurationAtom, ItemMapAtom, SelectedItemsAtom } from "../atoms";
import useItems from "./useItems";

const useItemActions = () => {
  const baseActions = useItems();
  const { actions } = useRecoilValue(ConfigurationAtom);

  const actionWrapper = useRecoilCallback(
    ({ snapshot }) => async (action, givenItemIds, config = {}) => {
      const itemIds =
        givenItemIds || (await snapshot.getPromise(SelectedItemsAtom));

      let currentItemMap;
      const getItem = async (id) => {
        if (!currentItemMap) {
          currentItemMap = await snapshot.getPromise(ItemMapAtom);
        }
        return currentItemMap[id];
      };
      await action(itemIds, config, { ...baseActions, getItem });
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
