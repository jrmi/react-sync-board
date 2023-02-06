import React from "react";

import { useSyncedStore } from "@/board/store/synced";

const useDebouncedItems = () => {
  const [items, itemIds, getItemList] = useSyncedStore((state) => [
    state.items,
    state.itemIds,
    state.getItemList,
  ]);
  const [debouncedItems, setDebouncedItems] = React.useState(getItemList());
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    const currentItemList = getItemList();
    startTransition(() => {
      setDebouncedItems(currentItemList);
    });
  }, [items, itemIds, getItemList]);

  return debouncedItems;
};

export default useDebouncedItems;
