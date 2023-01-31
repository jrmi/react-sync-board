import React from "react";
import { useThrottledEffect } from "@react-hookz/web/esm";

import { useSyncedStore } from "@/board/store/synced";

const useDebouncedItems = () => {
  const [items, itemIds, getItemList] = useSyncedStore((state) => [
    state.items,
    state.itemIds,
    state.getItemList,
  ]);
  const [debouncedItems, setDebouncedItems] = React.useState(getItemList());

  useThrottledEffect(
    () => {
      const currentItemList = getItemList();
      setDebouncedItems(currentItemList);
    },
    [items, itemIds, getItemList],
    300
  );

  return debouncedItems;
};

export default useDebouncedItems;
