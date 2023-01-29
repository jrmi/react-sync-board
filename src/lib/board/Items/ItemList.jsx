import React from "react";
import { useRecoilValue } from "recoil";
import Item from "./Item";
import useItemActions from "./useItemActions";

import { useSyncedItems } from "@/board/store/items";
import { ConfigurationAtom } from "..";
import { useUsers } from "@/users";
import useSelection from "../store/selection";

const ItemList = () => {
  const { updateItem } = useItemActions();
  const [itemList, itemMap] = useSyncedItems((state) => [
    state.itemIds,
    state.items,
  ]);
  const selection = useSelection((state) => state.selection);
  const { boardSize, showResizeHandle, itemTemplates } =
    useRecoilValue(ConfigurationAtom);
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
