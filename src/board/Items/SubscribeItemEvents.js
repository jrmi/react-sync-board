import React from "react";
import { useSetRecoilState } from "recoil";

import useWire from "../../hooks/useWire";
import useItemActions from "./useItemActions";

import { ItemMapAtom } from "../atoms";

export const SubcribeItemEvents = () => {
  const { wire } = useWire("board");

  const setItemMap = useSetRecoilState(ItemMapAtom);

  const { updateItemOrder, moveItems, removeItems, pushItem } =
    useItemActions();

  const batchUpdate = React.useCallback(
    (updatedItems) => {
      setItemMap((prevItemMap) => ({ ...prevItemMap, ...updatedItems }));
    },
    [setItemMap]
  );

  React.useEffect(() => {
    const unsub = wire.subscribe("batchItemsUpdate", (updatedItems) => {
      batchUpdate(updatedItems);
    });
    return unsub;
  }, [wire, batchUpdate]);

  React.useEffect(() => {
    const unsub = wire.subscribe(
      "selectedItemsMove",
      ({ itemIds, posDelta }) => {
        moveItems(itemIds, posDelta, false);
      }
    );
    return unsub;
  }, [wire, moveItems]);

  React.useEffect(() => {
    const unsub = wire.subscribe("updateItemListOrder", (itemIds) => {
      updateItemOrder(itemIds, false);
    });
    return unsub;
  }, [wire, updateItemOrder]);

  React.useEffect(() => {
    const unsub = wire.subscribe("pushItem", (newItem) => {
      pushItem(newItem, null, false);
    });
    return unsub;
  }, [wire, pushItem]);

  React.useEffect(() => {
    const unsub = wire.subscribe("insertItemBefore", ([newItem, beforeId]) => {
      pushItem(newItem, beforeId, false);
    });
    return unsub;
  }, [wire, pushItem]);

  React.useEffect(() => {
    const unsub = wire.subscribe("removeItems", (itemIds) => {
      removeItems(itemIds, false);
    });
    return unsub;
  }, [wire, removeItems]);

  return null;
};

export default SubcribeItemEvents;
