import { create } from "zustand";
import { shallow } from 'zustand/shallow';
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
const itemInteractions = (set, get) => ({
  interactions: {},
  getInteractions: () => get().interactions,
  register: (interaction, callback) =>
    set((state) => {
      const nextInteraction = [...(state.interactions[interaction] || [])];
      nextInteraction.push(callback);
      return {
        interactions: { ...state.interaction, [interaction]: nextInteraction },
      };
    }),
  unregister: (interaction, callback) =>
    set((state) => {
      const nextInteraction = (state.interactions[interaction] || []).filter(
        (c) => c !== callback
      );
      return {
        interactions: { ...state.interaction, [interaction]: nextInteraction },
      };
    }),
  callInteractions: (interaction, items) => {
    if (!get().interactions[interaction]) return;
    get().interactions[interaction].forEach((callback) => {
      callback(items);
    });
  },
});

const useMainStoreBare = create((...args) => ({
  ...configuration(...args),
  ...boardState(...args),
  ...itemInteractions(...args),
}));

const useMainStore = (selector, equalityFn)=>{
  return useMainStoreBare(selector, equalityFn? equalityFn: shallow)
}

export default useMainStore;
