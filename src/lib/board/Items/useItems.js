import React from "react";

import { useSyncedStore } from "@/board/store/synced";

const useItems = () => {
  const [itemIds, items] = useSyncedStore((state) => [
    state.itemIds,
    state.items,
  ]);

  const itemList = React.useMemo(
    () => itemIds.map((id) => items[id]),
    [itemIds, items]
  );

  return itemList;
};

export default useItems;
