import React from "react";
import { useRecoilValue } from "recoil";

import { AllItemsSelector } from "@/board";

const WatchItemsChange = ({ onChange }) => {
  const items = useRecoilValue(AllItemsSelector);

  React.useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  return null;
};

export default WatchItemsChange;
