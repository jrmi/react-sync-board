import { useSyncedStore } from "@/board/store/synced";

const useItems = () => {
  // TODO check perf
  const items = useSyncedStore((state) => state.getItemList());
  return items;
};

export default useItems;
