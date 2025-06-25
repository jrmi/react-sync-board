import Item from "./Item";
import useItemActions from "./useItemActions";

import { useSyncedStore } from "@/board/store/synced";
import useMainStore from "../store/main";
import { useSyncedUsers } from "@/users/store";
import { css, keyframes } from "goober";

const pulsingAnimation = keyframes`
 0% { 
   filter: brightness(1) contrast(1) saturate(1) invert(0);
 }
 50% { 
   filter: brightness(1.3) contrast(1) saturate(1.3) invert(0);
 }
 100% { 
   filter: brightness(1) contrast(1) saturate(1) invert(0);
 }
`;

const ItemList = () => {
  const { updateItem } = useItemActions();

  const [itemList, itemMap] = useSyncedStore((state) => [
    state.itemIds,
    state.items,
  ]);

  const [boardSize, showResizeHandle, itemTemplates, pulsing, selection] =
    useMainStore((state) => [
      state.config.boardSize,
      state.config.showResizeHandle,
      state.config.itemTemplates,
      state.config.pulsing,
      state.selection,
    ]);

  const [getCurrentUser] = useSyncedUsers((state) => [state.getUser]);

  const baseCSS = {
    position: "absolute",
    top: `${boardSize / 2}px`,
    left: `${boardSize / 2}px`,
    display: "inline-block",
    lineHeight: 0,
  };

  if (pulsing) {
    baseCSS.animation = `${pulsingAnimation} 1s infinite ease-in-out`;
  }

  const itemClassName = css(baseCSS);

  return itemList.map((itemId) => (
    <Item
      key={itemId}
      state={itemMap[itemId]}
      setState={updateItem}
      isSelected={selection.includes(itemId)}
      itemMap={itemTemplates}
      boardSize={boardSize}
      getCurrentUser={getCurrentUser}
      showResizeHandle={showResizeHandle}
      className={itemClassName}
    />
  ));
};

export default ItemList;
