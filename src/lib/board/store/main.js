/*
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
});*/

import { create } from "zustand";
import { DEFAULT_BOARD_MAX_SIZE } from "@/settings";

const configuration = (set, get) => ({
  config: {
    itemTemplates: {},
    actions: {},
    uid: null,
    itemExtent: {},
    boardWrapperRect: {},
    boardSize: DEFAULT_BOARD_MAX_SIZE,
  },
  updateConfiguration: (toUpdate) =>
    set((state) => ({ config: { ...state.config, ...toUpdate } })),
  getConfiguration: () => get().config,
});
const boardState = (set, get) => ({
  movingItems: false,
  selecting: false,
  zooming: false,
  panning: false,
  translateX: 0,
  translateY: 0,
  scale: 1,
});
const itemInteractions = (set, get) => ({ interaction: {} });

const useMainStore = create((...args) => ({
  ...configuration(...args),
  ...boardState(...args),
  ...itemInteractions(...args),
}));

export default useMainStore;
