import React, { useContext } from "react";
import { createStore } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { DEFAULT_BOARD_MAX_SIZE } from "@/settings";
import { equalArrayValues, storeEquality } from "@/storeEquality";

const Context = React.createContext();

const configuration = (set, get) => ({
  config: {
    itemTemplates: {},
    actions: {},
    uid: null,
    itemExtent: { x: 0, y: 0, radius: 0 },
    boardWrapperRect: {},
    boardSize: DEFAULT_BOARD_MAX_SIZE,
  },
  updateConfiguration: (toUpdate) =>
    set((state) => {
      if (
        Object.keys(toUpdate).every((key) =>
          Object.is(state.config[key], toUpdate[key])
        )
      ) {
        return state;
      }
      return { config: { ...state.config, ...toUpdate } };
    }),
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
    rotate: 0,
  },
  updateBoardState: (toUpdate) =>
    set((state) => {
      if (
        Object.keys(toUpdate).every((key) =>
          Object.is(state.boardState[key], toUpdate[key])
        )
      ) {
        return state;
      }
      return { boardState: { ...state.boardState, ...toUpdate } };
    }),
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
        interactions: { ...state.interactions, [interaction]: nextInteraction },
      };
    }),
  unregister: (interaction, callback) =>
    set((state) => {
      const nextInteraction = (state.interactions[interaction] || []).filter(
        (c) => c !== callback
      );
      return {
        interactions: { ...state.interactions, [interaction]: nextInteraction },
      };
    }),
  callInteractions: (interaction, itemIds) => {
    if (!get().interactions[interaction]) return;
    get().interactions[interaction].forEach((callback) => {
      setTimeout(() => callback(itemIds), 0);
    });
  },
});

const selection = (set, get) => ({
  selection: [],
  setSelection: (idsToSelect) =>
    set((state) => {
      if (equalArrayValues(state.selection, idsToSelect)) {
        return state;
      }
      return { selection: idsToSelect };
    }),
  getSelection: () => get().selection,
  select: (idsToAdd) =>
    set((state) => {
      if (idsToAdd.length === 0) {
        return state;
      }
      return { selection: [...state.selection, ...idsToAdd] };
    }),
  unselect: (itemsIdToRemove) =>
    set((state) => {
      const nextSelection = state.selection.filter(
        (id) => !itemsIdToRemove.includes(id)
      );
      if (equalArrayValues(state.selection, nextSelection)) {
        return state;
      }
      return { selection: nextSelection };
    }),
  clear: () =>
    set((state) => {
      if (state.selection.length > 0) {
        return { selection: [] };
      } else {
        return state;
      }
    }),
  reverse: () =>
    set((state) => {
      if (state.selection.length < 2) {
        return state;
      }
      const reversed = [...state.selection];
      reversed.reverse();
      if (equalArrayValues(state.selection, reversed)) return state;
      return { selection: reversed };
    }),
  selectionBox: null,
  setSelectionBox: (newSelectionBox) =>
    set((state) => {
      const prevBB = state.selectionBox;
      if (!prevBB && !newSelectionBox) {
        return state;
      }
      if (
        !prevBB ||
        !newSelectionBox ||
        prevBB.top !== newSelectionBox.top ||
        prevBB.left !== newSelectionBox.left ||
        prevBB.width !== newSelectionBox.width ||
        prevBB.height !== newSelectionBox.height
      ) {
        return { selectionBox: newSelectionBox };
      }
      return state;
    }),
});

export const createMainStore = () =>
  createStore((...args) => ({
    ...configuration(...args),
    ...boardState(...args),
    ...itemInteractions(...args),
    ...selection(...args),
  }));

export const MainStoreProvider = ({ children }) => {
  const [store] = React.useState(createMainStore);

  return <Context.Provider value={store}>{children}</Context.Provider>;
};

export const useMainStore = (selector) => {
  const store = useContext(Context);
  return useStoreWithEqualityFn(store, selector, storeEquality);
};

export default useMainStore;
