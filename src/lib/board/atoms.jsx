import { atom } from "recoil";

export const BoardConfigAtom = atom({
  key: "boardConfig",
  default: {},
});

// Session
export const BoardStateAtom = atom({
  key: "boardState",
  default: {
    movingItems: false,
    selecting: false,
    zooming: false,
    panning: false,
  },
});

// Session
export const BoardTransformAtom = atom({
  key: "BoardTransform",
  default: {
    translateX: 0,
    translateY: 0,
    scale: 1,
  },
});

// Session
export const ItemInteractionsAtom = atom({
  key: "itemInteractions",
  default: {},
});

export default {
  BoardConfigAtom,
  ItemInteractionsAtom,
  BoardTransformAtom,
};
