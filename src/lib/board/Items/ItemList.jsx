import Item from "./Item";
import useItemActions from "./useItemActions";

import { useSyncedStore } from "@/board/store/synced";
import { useUsers } from "@/users";
import useSelection from "../store/selection";
import useMainStore from "../store/main";

const ItemList = () => {
  const { updateItem } = useItemActions();
  const [itemList, itemMap] = useSyncedStore((state) => [
    state.itemIds,
    state.items,
  ]);
  const selection = useSelection((state) => state.selection);
  const [boardSize, showResizeHandle, itemTemplates] = useMainStore((state) => [
    state.config.boardSize,
    state.config.showResizeHandle,
    state.config.itemTemplates,
  ]);
  const { currentUser } = useUsers();

  return itemList.map((itemId) => (
    <Item
      key={itemId}
      state={itemMap[itemId]}
      setState={updateItem}
      isSelected={selection.includes(itemId)}
      itemMap={itemTemplates}
      boardSize={boardSize}
      currentUser={currentUser}
      showResizeHandle={showResizeHandle}
    />
  ));
};

export default ItemList;
