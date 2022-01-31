import { atom, selector } from "recoil";
import { DEFAULT_BOARD_MAX_SIZE } from "../settings";

export const ConfigurationAtom = atom({
  key: "configuration",
  default: {
    itemTemplates: {},
    actions: {},
    uid: null,
    itemExtent: {},
    boardWrapperRect: {},
    boardSize: DEFAULT_BOARD_MAX_SIZE,
  },
});

export const BoardConfigAtom = atom({
  key: "boardConfig",
  default: {},
});

export const BoardStateAtom = atom({
  key: "boardState",
  default: {
    movingItems: false,
    selecting: false,
    zooming: false,
    panning: false,
  },
});

export const ItemListAtom = atom({
  key: "itemList",
  default: [],
});

export const ItemMapAtom = atom({
  key: "ItemMap",
  default: {},
});

export const AllItemsSelector = selector({
  key: "AllItemsSelector",
  get: ({ get }) => {
    const itemMap = get(ItemMapAtom);
    return get(ItemListAtom)
      .map((id) => itemMap[id])
      .filter((item) => item); // This filter clean the selection of missing items
  },
});

export const BoardTransformAtom = atom({
  key: "BoardTransform",
  default: {
    translateX: 0,
    translateY: 0,
    scale: 1,
  },
});

export const ItemInteractionsAtom = atom({
  key: "itemInteractions",
  default: {},
});

export const SelectedItemsAtom = atom({
  key: "selectedItems",
  default: [],
});

export const SelectionBoxAtom = atom({
  key: "selectionBox",
  default: null,
});

export default {
  ItemListAtom,
  BoardConfigAtom,
  AllItemsSelector,
  ItemMapAtom,
  ItemInteractionsAtom,
  BoardTransformAtom,
  SelectedItemsAtom,
};
