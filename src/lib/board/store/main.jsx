import React, { useContext } from "react";
import { createStore, useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { DEFAULT_BOARD_MAX_SIZE } from "@/settings";

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
  // TODO optimize when same values as before
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
    rotate: 0,
  },
  // TODO optimize when same values as before
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
      callback(itemIds);
    });
  },
});

const selection = (set, get) => ({
  selection: [],
  setSelection: (idsToSelect) =>
    set((state) => {
      if (JSON.stringify(state.selection) !== JSON.stringify(idsToSelect)) {
        return { selection: idsToSelect };
      }
      return {};
    }),
  getSelection: () => get().selection,
  select: (idsToAdd) =>
    set((state) => ({
      selection: [...state.selection, ...idsToAdd],
    })),
  unselect: (itemsIdToRemove) =>
    set((state) => ({
      selection: state.selection.filter((id) => !itemsIdToRemove.includes(id)),
    })),
  clear: () =>
    set((state) => {
      if (state.selection.length > 0) {
        return { selection: [] };
      } else {
        return {};
      }
    }),
  reverse: () =>
    set((state) => {
      const reversed = [...state.selection];
      reversed.reverse();
      return { selection: reversed };
    }),
  selectionBox: null,
  setSelectionBox: (newSelectionBox) =>
    set((state) => {
      const prevBB = state.selectionBox;
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
      return {};
    }),
});

export const MainStoreProvider = ({ children }) => {
  const [store] = React.useState(() =>
    createStore((...args) => ({
      ...configuration(...args),
      ...boardState(...args),
      ...itemInteractions(...args),
      ...selection(...args),
    }))
  );

  return <Context.Provider value={store}>{children}</Context.Provider>;
};

export const useMainStore = (selector, equalityFn) => {
  const store = useContext(Context);
  return useStore(store, selector, equalityFn ? equalityFn : shallow);
};

export default useMainStore;
