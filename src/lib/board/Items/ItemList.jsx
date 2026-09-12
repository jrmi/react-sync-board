import Item from "./Item";
import useItemActions from "./useItemActions";

import { useSyncedStore } from "@/board/store/synced";
import useMainStore from "../store/main";
import { useSyncedUsers } from "@/users/store";
import { css } from "goober";

const ItemList = () => {
  const { updateItem } = useItemActions();

  const [itemList, itemMap] = useSyncedStore((state) => [
    state.itemIds,
    state.items,
  ]);

  const [showResizeHandle, itemTemplates, selection] = useMainStore(
    (state) => [
      state.config.showResizeHandle,
      state.config.itemTemplates,
      state.selection,
    ]
  );
  const [getCurrentUser] = useSyncedUsers((state) => [state.getUser]);

  const itemClassName = css({
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "auto",
    display: "inline-block",
    lineHeight: 0,
  });

  return itemList.map((itemId) => (
    <Item
      key={itemId}
      state={itemMap[itemId]}
      setState={updateItem}
      isSelected={selection.includes(itemId)}
      itemMap={itemTemplates}
      getCurrentUser={getCurrentUser}
      showResizeHandle={showResizeHandle}
      className={itemClassName}
    />
  ));
};

export default ItemList;
