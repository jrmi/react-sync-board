import { atom } from "recoil";

export const BoardConfigAtom = atom({
  key: "boardConfig",
  default: {},
});

// Session
export const ItemInteractionsAtom = atom({
  key: "itemInteractions",
  default: {},
});

export default {
  BoardConfigAtom,
  ItemInteractionsAtom,
};
