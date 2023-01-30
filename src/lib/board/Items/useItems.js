import { useSyncedStore } from "@/board/store/synced";

const useItems = () => {
  const items = useSyncedStore((state) => state.getItemList());
  return items;
};

export default useItems;
