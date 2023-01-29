/*
// Session

// Session

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
  // TODO optimize when same value as before
  updateConfiguration: (toUpdate) =>
    set((state) => ({ config: { ...state.config, ...toUpdate } })),
  getConfiguration: () => get().config,
});
const boardState = (set, get) => ({
  boardState: {
    movingItems: false,
    selecting: false,
    zooming: false,
    panning: false,
    translateX: 0,
    translateY: 0,
    scale: 1,
  },
  updateBoardState: (toUpdate) =>
    set((state) => ({ boardState: { ...state.boardState, ...toUpdate } })),
  getBoardState: () => get().boardState,
});
const itemInteractions = (set, get) => ({ interaction: {} });

const useMainStore = create((...args) => ({
  ...configuration(...args),
  ...boardState(...args),
  ...itemInteractions(...args),
}));

export default useMainStore;
