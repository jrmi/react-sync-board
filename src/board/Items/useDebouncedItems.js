import React from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";
import { useDebouncedEffect } from "@react-hookz/web/esm";

import { AllItemsSelector } from "../atoms";

const useDebouncedItems = () => {
  const items = useRecoilValue(AllItemsSelector);
  const [debouncedItems, setDebouncedItems] = React.useState(items);

  const updateDebouncedItems = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const currentItemMap = await snapshot.getPromise(AllItemsSelector);
        setDebouncedItems(currentItemMap);
      },
    []
  );

  useDebouncedEffect(updateDebouncedItems, [items], 300);

  return debouncedItems;
};

export default useDebouncedItems;
