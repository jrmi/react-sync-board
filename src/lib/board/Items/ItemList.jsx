import React from "react";
import { useRecoilValue } from "recoil";
import Item from "./Item";
import useItemActions from "./useItemActions";

import { /*ItemListAtom, ItemMapAtom,*/ SelectedItemsAtom } from "../atoms";

import { useSyncedItems } from "@/board/store/items";
import { ConfigurationAtom } from "..";
import { useUsers } from "@/users";

const ItemList = () => {
  const { updateItem } = useItemActions();
  /*const itemList = useRecoilValue(ItemListAtom);
  const itemMap = useRecoilValue(ItemMapAtom);*/
  const [itemList, itemMap] = useSyncedItems((state) => [
    state.itemIds,
    state.items,
  ]);
  const selectedItems = useRecoilValue(SelectedItemsAtom);
  const { boardSize, showResizeHandle, itemTemplates } =
    useRecoilValue(ConfigurationAtom);
  const { currentUser } = useUsers();

  return itemList.map((itemId) => (
    <Item
      key={itemId}
      state={itemMap[itemId]}
      setState={updateItem}
      isSelected={selectedItems.includes(itemId)}
      itemMap={itemTemplates}
      boardSize={boardSize}
      currentUser={currentUser}
      showResizeHandle={showResizeHandle}
    />
  ));
};

export default ItemList;
