import { atom } from "recoil";
import { DEFAULT_BOARD_MAX_SIZE } from "@/settings";

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

export default {
  BoardConfigAtom,
  ItemInteractionsAtom,
  BoardTransformAtom,
};
