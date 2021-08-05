import React from "react";
import { useSetRecoilState } from "recoil";

import useC2C from "../../hooks/useC2C";
import useItemBaseActions from "./useItemBaseActions";

import { ItemMapAtom } from "../atoms";

export const SubcribeItemEvents = () => {
  const { c2c } = useC2C("board");

  const setItemMap = useSetRecoilState(ItemMapAtom);

  const {
    updateItemOrder,
    moveItems,
    removeItems,
    pushItem,
  } = useItemBaseActions();

  const batchUpdate = React.useCallback(
    (updatedItems) => {
      setItemMap((prevItemMap) => ({ ...prevItemMap, ...updatedItems }));
    },
    [setItemMap]
  );

  React.useEffect(() => {
    const unsub = c2c.subscribe("batchItemsUpdate", (updatedItems) => {
      batchUpdate(updatedItems);
    });
    return unsub;
  }, [c2c, batchUpdate]);

  React.useEffect(() => {
    const unsub = c2c.subscribe(
      "selectedItemsMove",
      ({ itemIds, posDelta }) => {
        moveItems(itemIds, posDelta, false);
      }
    );
    return unsub;
  }, [c2c, moveItems]);

  React.useEffect(() => {
    const unsub = c2c.subscribe("updateItemListOrder", (itemIds) => {
      updateItemOrder(itemIds, false);
    });
    return unsub;
  }, [c2c, updateItemOrder]);

  React.useEffect(() => {
    const unsub = c2c.subscribe("pushItem", (newItem) => {
      pushItem(newItem, null, false);
    });
    return unsub;
  }, [c2c, pushItem]);

  React.useEffect(() => {
    const unsub = c2c.subscribe("insertItemBefore", ([newItem, beforeId]) => {
      pushItem(newItem, beforeId, false);
    });
    return unsub;
  }, [c2c, pushItem]);

  React.useEffect(() => {
    const unsub = c2c.subscribe("removeItems", (itemIds) => {
      removeItems(itemIds, false);
    });
    return unsub;
  }, [c2c, removeItems]);

  return null;
};

export default SubcribeItemEvents;
