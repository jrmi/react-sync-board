import { useSyncedItems } from "../store/items";

const useItems = () => {
  const items = useSyncedItems((state) => state.getItemList());
  return items;
};

export default useItems;
